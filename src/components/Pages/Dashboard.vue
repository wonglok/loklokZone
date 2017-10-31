<template>
<div>
  <h1>
    Dashboard
  </h1>
  <button @click="createZone()">+</button>
  <ul v-if="uid">
    <li :key="zid" v-for="(zone, zid) in zones">
      <router-link :to="{ path: `/editor/${uid}/${zid}` }">{{ zone.name }}</router-link>
      <button @click="removeZone({ zid })">RemoveZone</button>
    </li>
  </ul>
</div>
</template>

<script>
import snippets from '@/../functions/snippets.js'
import { appState, api, readyRT } from '@/sys/index.js'

export default {
  data () {
    return {
      appState,
      zones: {}
    }
  },
  mounted () {
    readyRT().then(() => {
      api.db.ref().child('/vuejs').child(this.uid).limitToLast(100).on('value', (snap) => {
        this.zones = snap.val()
      })
    })
  },
  methods: {
    removeZone ({ zid }) {
      if (!window.confirm('RemoveZone?')) { return }
      api.db.ref().child('/vuejs').child(this.uid).child(zid).remove()
    },
    createZone () {
      var ref = api.db.ref().child('/vuejs').child(this.uid)
      var newKey = ref.push().key
      var title = window.prompt('What\'s the name of the new Zone?') || newKey
      ref.child(newKey).set({
        name: title,
        files: [
          {
            protected: true,
            path: '/index.html',
            content: snippets.html({ author: appState.user.displayName, title })
          },
          {
            protected: true,
            path: '/main.js',
            content: snippets.entryJS()
          },
          {
            protected: true,
            path: '/routes.js',
            content: snippets.routerJS()
          },
          {
            protected: true,
            path: '/pages/App.vue',
            content: snippets.AppVue()
          },
          {
            protected: false,
            path: '/pages/Hello.vue',
            content: snippets.Hello()
          },
          {
            protected: false,
            path: '/pages/About.vue',
            content: snippets.About()
          },
          {
            protected: false,
            path: '/parts/Fun.vue',
            content: snippets.Fun()
          }
        ],
        refresher: Math.random()
      })
    }
  },
  computed: {
    uid () {
      if (appState.isLoggedIn) {
        return appState.user.uid
      } else {
        return false
      }
    }
  }

}
</script>

<style scoped>

</style>
