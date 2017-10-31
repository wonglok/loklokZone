exports.entryJS = function () {
  return `/* global: Vue */
import App from './pages/App.vue'
import router from './routes.js'

new Vue({
    router,
    components: { App },
    el: '#app',
    template: '<App />'
})

`
}

exports.routerJS = function () {
  return `/* global: VueRouter */

Vue.use(VueRouter)

import Hello from '@/pages/Hello.vue'
import About from '@/pages/About.vue'

var router = new VueRouter({
    routes: [
        {
            path: '/',
            name: 'Hello',
            component: Hello
        },
        {
            path: '/about',
            name: 'About',
            component: About
        }
    ]
})

export default router
  `
}

exports.AppVue = function () {
  return `<template>
  <div id="app">
    <h1>{{ msg }}</h1>
    <p>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
    </p>
    <router-view></router-view>
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

`
}

exports.Hello = function () {
  return `<template>
  <div>
    <h1>{{ essentialMsg }}</h1>
  </div>
</template>

<script>
export default {
  name: 'Hello',
  data () {
    return {
      essentialMsg: 'Hello Component'
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
`
}

exports.About = function () {
  return `<template>
  <div>
    <h1>{{ essentialMsg }}</h1>
  </div>
</template>

<script>
export default {
  name: 'About',
  data () {
    return {
      essentialMsg: 'About Component'
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
`
}

exports.Fun = function () {
  return `<template>
  <div>
    <h1>{{ essentialMsg }}</h1>
  </div>
</template>

<script>
export default {
  name: 'Fun',
  data () {
    return {
      essentialMsg: 'Fun Component'
    }
  }
}
</script>

<style lang="scss" scoped>

</style>

`
}

exports.html = function ({ author, title }) {
  return `<!DOCTYPE html>
<html>
  <head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title || 'New Web'}</title>
  <meta name="author" content="${(author || '')}">
  <meta name="description" content="${title || 'WebPack on Cloud Functions'}">
  <meta name="keywords" content="fun fun, vuejs">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.2/vue.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue-router/3.0.1/vue-router.min.js"></script>
  <!--inject-auto-refresher-here-->
  <style type="text/css">
    html, body {
      width: 100%;
      height: 100%;
      margin: 0px;
      padding: 0px;
    }
  </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="./build.js"></script>
  </body>
</html>`
}

exports.refresher = function ({ uid, zid }) {
  return `
  <script src="https://www.gstatic.com/firebasejs/4.5.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/4.5.0/firebase-database.js"></script>
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
      var refresher = database.ref('/vuejs/${uid}/${zid}/refresher');
      var lastVal = false
      refresher.on('value', function (snapshot) {
        if (lastVal !== false) {
          window.location.search = ('?force=compile&rand=' + Math.random());
        }
        lastVal = snapshot.val()
      });
      // window.onload = function () {
      //   var url = window.location.href;
      //   url = url.replace(window.location.search, '');
      //   window.location.replace(url);
      // };
    }());
  </script>
`
}
