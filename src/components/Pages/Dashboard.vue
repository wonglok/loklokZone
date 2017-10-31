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
      api.db.ref().child('/vuejs').child(this.uid).on('value', (snap) => {
        this.zones = snap.val()
      })
    })
  },
  methods: {
    removeZone ({ zid }) {
      api.db.ref().child('/vuejs').child(this.uid).child(zid).remove()
    },
    createZone () {
      var ref = api.db.ref().child('/vuejs').child(this.uid)
      var newKey = ref.push().key
      ref.child(newKey).set({
        name: newKey,
        files: [
          {
            protected: true,
            path: '/index.html',
            content: snippets.html()
          },
          {
            protected: true,
            path: '/main.js',
            content: snippets.entryJS()
          },
          {
            protected: true,
            path: '/pages/App.vue',
            content: snippets.AppVue()
          },
          {
            protected: false,
            path: '/parts/Counter.vue',
            content: snippets.Counter()
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
