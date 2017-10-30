var MemoryFileSystem = require('memory-fs')
var webpackConfig = require('./webpack.config.js')
var webpack = require('webpack')
var functions = require('firebase-functions')

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
// var preloadPackage = require('./preloadPackage.js') d

var buzz = makeEventBus()
var cache = new LRU(50)

exports.clearCacheOnSave = functions.database.ref('/vuejs/{zid}/refresher').onWrite(event => {
  var zid = event.params.zid
  console.log('***** Cleraing Cache at', zid)
  cache.set(zid, false)
})

exports.webpacker = function ({ app }) {
  var routeBase = '/v1/vuejs'

  function setupSrc ({ base, zid }) {
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

      // preloadPackage([
      //   'vue'
      // ], { fs: mfs })

      mfs.mkdirpSync(srcPath + '')
      mfs.writeFileSync(srcPath + '/App.vue', `
<template>
  <div id="app">
    <h1>{{ msg }}</h1>
    <h2>Essential Links</h2>
    <ul>
      <li><a href="https://vuejs.org" target="_blank">Core Docs</a></li>
      <li><a href="https://forum.vuejs.org" target="_blank">Forum</a></li>
      <li><a href="https://gitter.im/vuejs/vue" target="_blank">Gitter Chat</a></li>
      <li><a href="https://twitter.com/vuejs" target="_blank">Twitter</a></li>
    </ul>
    <h2>Ecosystem</h2>
    <ul>
      <li><a href="http://router.vuejs.org/" target="_blank">vue-router</a></li>
      <li><a href="http://vuex.vuejs.org/" target="_blank">vuex</a></li>
      <li><a href="http://vue-loader.vuejs.org/" target="_blank">vue-loader</a></li>
      <li><a href="https://github.com/vuejs/awesome-vue" target="_blank">awesome-vue</a></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<style lang="scss" scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
`)

      mfs.writeFileSync(srcPath + '/main.js', `
/* global: Vue */
import App from './App.vue'

new Vue({
  components: { App },
  el: '#app',
  template: '<App />'
})

`)

      mfs.mkdirpSync(webpackBase + '/dist')
      mfs.writeFileSync(webpackBase + '/dist/index.html', `
<!DOCTYPE html>
<html>
  <head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>title</title>
  <meta name="author" content="Wong Lok">
  <meta name="description" content="Running WebPack inside Google Cloud Functions">
  <meta name="keywords" content="fun fun, vuejs">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.2/vue.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue-router/3.0.1/vue-router.min.js"></script>

  <script src="https://www.gstatic.com/firebasejs/4.5.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/4.5.0/firebase-database.js"></script>

  <style type="text/css">
    html, body {
      margin: 0px;
      padding: 0px;
    }
  </style>
  </head>
  <body>
    <div id="app"></div>
    <!--refresher-->
    <script>
      (function () {
        var config = {
          apiKey: "AIzaSyBxYyXU4YdSBxk2Dn9UF12bFWRdSWQtm2Q",
          authDomain: "loklok-zone.firebaseapp.com",
          databaseURL: "https://loklok-zone.firebaseio.com",
          projectId: "loklok-zone",
          storageBucket: "loklok-zone.appspot.com",
          messagingSenderId: "680362980709"
        };
        firebase.initializeApp(config);
        var database = firebase.database();

        var refresher = database.ref('/vuejs/${zid}/refresher');
        var lastVal = false
        refresher.on('value', function (snapshot) {
          if (lastVal !== false) {
            window.location.reload();
          }
          lastVal = snapshot.val()
        });
      }());
    </script>
    <script src="./build.js"></script>
  </body>
</html>
`)

      compiler.inputFileSystem = mfs
      compiler.outputFileSystem = mfs
      compiler.resolvers.normal.fileSystem = mfs
      compiler.resolvers.context.fileSystem = mfs

      resolve({ mfs, compiler })
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

  function processInfo ({ zid }) {
    return setupSrc({ base: routeBase + '/' + zid, zid })
      .then(({ compiler, mfs }) => {
        cache.set(zid, { mfs, state: 'compile' })
        return compileSrc({ compiler, mfs })
      })
      .then(({ mfs }) => {
        cache.set(zid, { mfs, state: 'ready' })
        buzz.trigger('compile-ready-' + zid, { mfs, state: 'ready' })
        return { mfs }
      })
  }

  app.get(routeBase + '/:zid*', (req, res) => {
    var zid = req.params.zid
    function sender ({ mfs }) {
      if (req.path === routeBase + '/' + zid + '/dist/index.html') {
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

    var data = cache.get(zid)
    if (data && data.state === 'ready') {
      var { mfs } = data
      sender({ mfs })
    } else if (data && data.state === 'compile') {
      var func = ({ mfs }) => {
        sender({ mfs })
        buzz.off('compile-ready-' + zid, func)
      }
      buzz.on('compile-ready-' + zid, func)
    } else {
      processInfo({ zid: zid })
        .then(({ mfs }) => {
          sender({ mfs })
          // res.json({ path: req.path, mfs })
        })
    }
  })
}
