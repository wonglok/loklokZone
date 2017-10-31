import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Editor from '@/components/Pages/Editor'
import Login from '@/components/Pages/Login'
import Dashboard from '@/components/Pages/Dashboard'

import { appState, waitLoginInfo } from '@/sys'

Vue.use(Router)

var b4RouteEnter = (from, to, next) => {
  console.log(appState)
  if (appState.isLoggedIn === true) {
    next()
  } else {
    waitLoginInfo().then(() => {
      next()
    }, () => {
      next({
        path: '/login'
      })
    })
  }
}

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      beforeRouteEnter: b4RouteEnter
    },
    {
      path: '/editor/:uid/:zid',
      name: 'Editor',
      component: Editor,
      beforeRouteEnter: b4RouteEnter
    }
  ]
})
