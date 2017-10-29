var MemoryFileSystem = require('memory-fs')
var webpackConfig = require('./webpack.config.js')
var webpack = require('webpack')

function makeEventBus () {
  var evts = {}
  var api = {}
  api.on = (name, func) => {
    if (!evts[name]) {
      evts[name] = []
    }
    evts[name].push(func)
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

exports.webpacker = function ({ app }) {
  var routeBase = '/v1/vuejs'
  var rootBase = routeBase

  var buzz = makeEventBus()
  var cache = new LRU(30)

  function setupSrc ({ routeBase }) {
    return new Promise((resolve, reject) => {
      var srcPath = path.join(process.cwd())
      var webpackBase = routeBase

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
  name: 'app',
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
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
`)
      mfs.writeFileSync(srcPath + '/main.js', `
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
  <style type="text/css">
    html, body {
      margin: 0px;
      padding: 0px;
    }
  </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="${routeBase}/dist/build.js"></script>
  </body>
</html>

      `)

      //

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

  app.get(rootBase + '/:zid*', (req, res) => {
    function processInfo ({ zid }) {
      return setupSrc({ routeBase: routeBase + '/' + zid })
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

    function sender ({ mfs }) {
      if (req.path === routeBase + '/' + req.params.zid + '/dist/index.html') {
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
    var data = cache.get(req.params.zid)
    if (data && data.state === 'ready') {
      var { mfs } = data
      sender({ mfs })
    } else if (data && data.state === 'compile') {
      var func = ({ mfs }) => {
        sender({ mfs })
        buzz.off('compile-ready-' + req.params.zid, func)
      }
      buzz.on('compile-ready-' + req.params.zid, func)
    } else {
      processInfo({ zid: req.params.zid })
        .then(({ mfs }) => {
          sender({ mfs })
          // res.json({ path: req.path, mfs })
        })
    }
  })
}
