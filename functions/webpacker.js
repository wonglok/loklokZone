var MemoryFileSystem = require('memory-fs')
var webpackConfig = require('./webpack.config.js')
var webpack = require('webpack')
var functions = require('firebase-functions')
var admin = require('./admin').admin
var snippets = require('./snippets')

function makeEventBus () {
  var evts = {}
  var api = {}
  api.on = (name, func) => {
    if (!evts[name]) {
      evts[name] = []
    }
    evts[name].push(func)
  }
  api.once = (name, func) => {
    var newFn = (args) => {
      func(args)
      api.off(newFn)
    }
    api.on(name, newFn)
  }
  api.off = (name, func) => {
    if (!evts[name]) {
      evts[name] = []
    }
    var idx = evts[name].indexOf(func)
    evts[name].splice(idx, 1)
  }
  api.trigger = (name, args) => {
    if (!evts[name]) {
      evts[name] = []
    }
    for (var i = 0; i < evts[name].length; i++) {
      evts[name][i].call({}, args)
    }
  }
  return api
}
var LRU = require('lru')
var path = require('path')
var fs = require('fs')
var buzz = makeEventBus()
var cache = new LRU(50)

exports.clearCacheOnSave = functions.database.ref('/vuejs/{uid}/{zid}/files').onWrite(event => {
  var zid = event.params.zid
  var uid = event.params.uid
  console.log('***** Cleraing Cache at', zid)
  cache.set(zid + uid, false)
  return event.data.ref
})

function getZoneFiles ({ uid, zid }) {
  return new Promise((resolve, reject) => {
    admin.database().ref('/vuejs').child(uid).child(zid).once('value').then((snapshot) => {
      resolve(snapshot.val())
    }, (err) => {
      reject(err)
    })
  })
}

function writeToMFS ({ mfs, filesArr, srcPath, zid, webpackBase }) {
  filesArr = filesArr || []
  var sourcesWithoutHTML = filesArr.filter((file) => {
    return file.path.indexOf('index.html') === -1
  })

  mfs.mkdirpSync(srcPath)
  mfs.mkdirpSync(srcPath + '/Pages')
  mfs.writeFileSync(srcPath + '/Pages/App.vue', snippets.AppVue())
  mfs.writeFileSync(srcPath + '/main.js', snippets.entryJS())

  sourcesWithoutHTML.forEach((src) => {
    console.log(src)
    try {
      mfs.writeFileSync(srcPath + src.path, src.content)
    } catch (e) {
      console.error(e)
    }
  })

  mfs.mkdirpSync(webpackBase + '/dist')

  var sourceOfTHML = filesArr.filter((file) => {
    return file.path.indexOf('index.html') !== -1
  })[0]
  sourceOfTHML = sourceOfTHML || snippets.html()

  var refresher = snippets.refresher({ zid })
  mfs.writeFileSync(webpackBase + '/dist/index.html', sourceOfTHML.replace('<!--inject-auto-refresher-here-->', refresher))
}

function transformToArray (srcObj) {
  var keyArr = Object.keys(srcObj)
  var bucket = []
  for (var i = 0; i < keyArr.length; i++) {
    var obj = srcObj[keyArr[i]]
    obj['.key'] = keyArr[i]
    bucket.push(obj)
  }
  return bucket
}

exports.webpacker = function ({ app, anotherBase }) {
  var routeBase = '/v1/vuejs'

  function setupSrc ({ base, uid, zid }) {
    return new Promise((resolve, reject) => {
      var srcPath = path.join(process.cwd())
      var webpackBase = base

      var wcfg = webpackConfig({ entryBase: srcPath, outputBase: webpackBase, minify: true })
      var compiler = webpack(wcfg)
      var mfs = new MemoryFileSystem()

      const statOrig = mfs.stat.bind(mfs)
      const readFileOrig = mfs.readFile.bind(mfs)
      mfs.stat = function (_path, cb) {
        statOrig(_path, function (err, result) {
          if (err) {
            return fs.stat(_path, cb)
          } else {
            return cb(err, result)
          }
        })
      }
      mfs.readFile = function (path, cb) {
        readFileOrig(path, function (err, result) {
          if (err) {
            return fs.readFile(path, cb)
          } else {
            return cb(err, result)
          }
        })
      }
      compiler.inputFileSystem = mfs
      compiler.outputFileSystem = mfs
      compiler.resolvers.normal.fileSystem = mfs
      compiler.resolvers.context.fileSystem = mfs

      getZoneFiles({ uid, zid }).then((zone) => {
        console.log(zone)
        return writeToMFS({ mfs, filesArr: transformToArray((zone && zone.files) || {}), srcPath, zid, webpackBase })
      }).then(() => {
        resolve({ mfs, compiler })
        // resolve to compile
      })
    //
    })
  }

  function compileSrc ({ compiler, mfs }) {
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          reject(err)
        }
        resolve({ mfs })
      })
    })
  }

  function processInfo ({ zid, uid }) {
    return setupSrc({ base: routeBase + '/' + uid + '/' + zid, uid, zid })
      .then(({ compiler, mfs }) => {
        cache.set(zid + uid, { mfs, state: 'compile' })
        return compileSrc({ compiler, mfs })
      })
      .then(({ mfs }) => {
        cache.set(zid + uid, { mfs, state: 'ready' })
        buzz.trigger('compile-ready-' + zid, { mfs, state: 'ready' })
        return { mfs }
      })
  }

  app.get(routeBase + '/:uid/:zid*', (req, res) => {
    var zid = req.params.zid
    var uid = req.params.uid

    function sender ({ mfs }) {
      if (req.path === routeBase + '/' + uid + '/' + zid + '/dist/index.html') {
        res.set('html')
        try {
          res.send(mfs.readFileSync(req.path, 'utf8'))
        } catch (e) {
          res.json({ e, path: req.path, mfs })
        }
      } else {
        try {
          res.send(mfs.readFileSync(req.path, 'utf8'))
        } catch (e) {
          res.json({ e, path: req.path, mfs })
        }
      }
    }

    var data = cache.get(zid + uid)
    if (req.query && req.query.force === 'compile') {
      processInfo({ zid, uid })
        .then(({ mfs }) => {
          sender({ mfs })
          // res.json({ path: req.path, mfs })
        })
    } else if (data && data.state === 'ready') {
      var { mfs } = data
      sender({ mfs })
    } else if (data && data.state === 'compile') {
      var func = ({ mfs }) => {
        sender({ mfs })
        buzz.off('compile-ready-' + zid, func)
      }
      buzz.on('compile-ready-' + zid, func)
    } else {
      processInfo({ zid, uid })
        .then(({ mfs }) => {
          sender({ mfs })
          // res.json({ path: req.path, mfs })
        })
    }
  })
}
