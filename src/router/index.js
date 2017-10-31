import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Editor from '@/components/Pages/Editor'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/editor/:uid/:zid',
      name: 'Editor',
      component: Editor
    }
  ]
})
