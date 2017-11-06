<template>
  <div>
    <div class="menu">
      <router-link to="/dashboard">Dashboard</router-link>
      <a :href="`${getPreviewURL()}`" target="_blank">Preview</a>
      <input v-model="current.zoneName" @change="saveTitle()" @keyup.enter="saveTitle()" />
    </div>
    <div class="loader" :class="{ loading: loading }"></div>
    <div class="editor" v-if="is404">
      <h1>Zone Not Found....</h1>
      <h2><router-link to="/dashboard">Dashboard</router-link></h2>
    </div>
    <div class="editor" v-if="!is404">
      <div class="left-side">
        <TreeFolder :files="files" :buttons="true" :highlight="current.file" @add="addFile" @remove="tryRemoveFile" @edit="renameFile" @select="selectFile" />
      </div>
      <div class="right-side">
        <ACE v-if="current.file.path" @save="saveFiles" v-model="current.file.content" @input="(value) => { this.current.file.content = value }" @init="editorInit()" :lang="getLang(current.file.path)" theme="chrome" width="100%" :height="ace.height"></ACE>
      </div>
      <div class="modal">
        <Modal :show="modal.show"  @close="(v) => { modal.show = v }">
          <div v-if="modal.mode === 'remove-file'">
            <h1>Remove </h1>
            <h2>{{ modal.data.path }}</h2>
            <button @click="removeFile(modal.data.path); modal.show = false">Confirm Removal</button>
            <br />
            content: <br />
            <pre>{{ modal.data.content }}</pre>
          </div>
        </Modal>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import TreeFolder from '@/components/Parts/TreeFolder.vue'
import Modal from '@/components/Parts/Modal.vue'
import ACE from '@/components/Parts/ACE.vue'
// import ACE from 'vue2-ace-editor'
// import snippets from '@/../functions/snippets.js'
import { appState, readyRT, api } from '@/sys'

export default {
  components: {
    TreeFolder,
    Modal,
    ACE
  },
  data () {
    return {
      loading: false,
      appState,
      is404: false,
      uid: {},
      zid: {},
      ace: {
        height: window.innerHeight - 50
      },
      modal: {
        show: false,
        mode: 'remove-file',
        data: {}
      },
      current: {
        zoneName: '',
        file: {}
      },
      files: false
    }
  },
  computed: {
    content () {
      var current = this.current
      if (current && current.file && current.file.content) {
        return current.file.content
      } else {
        return ''
      }
    }
  },
  mounted () {
    this.prepZone()
  },
  methods: {
    saveTitle () {
      this.getZoneRef().child('name').set(this.current.zoneName)
    },
    prepZone () {
      this.loading = true
      readyRT().then(() => {
        this.getZoneRef().child('name').on('value', (snap) => {
          this.current.zoneName = snap.val()
        })
        this.getZoneRef().child('files').on('value', (snap) => {
          var raw = snap.val()
          if (raw) {
            var result = this.transformToArray(raw)
            if (!this.files) {
              this.current.file = result[0]
            }
            this.files = result
          } else {
            this.is404 = true
          }
          this.loading = false
        })
      })
    },
    transformToArray (srcObj) {
      var keyArr = Object.keys(srcObj)
      var bucket = []
      for (var i = 0; i < keyArr.length; i++) {
        var obj = srcObj[keyArr[i]]
        obj['.key'] = keyArr[i]
        bucket.push(obj)
      }
      return bucket
    },
    getPreviewURL () {
      return `//${this.getBase()}/v1/vuejs/${this.getUID()}/${this.getZID()}/dist/index.html`
    },
    getBase () {
      if (window.location.host === 'localhost:8080') {
        return 'localhost:5000'
      } else {
        return window.location.host
      }
    },
    getZID () {
      return this.$route.params.zid || this.zid
    },
    getUID () {
      return this.$route.params.uid || this.uid
    },
    getLang (path) {
      var ans = 'html'
      try {
        var ext = path.split('.').pop()

        if (ext === 'js') {
          ans = 'javascript'
        }
        if (ext === 'vue') {
          ans = 'html'
        }
        if (ext === 'html') {
          ans = 'html'
        }
      } catch (e) {
        console.log(e)
      }

      return ans
    },
    editorInit () {
      require('brace/mode/html')
      require('brace/mode/javascript')
      // require('brace/mode/sass')
      require('brace/theme/chrome')
    },
    addFile (path) {
      this.files.push({
        path,
        content: ''
      })
      this.getZoneRef().child('files').set(this.files.map((item) => {
        var newItem = {
          ...item
        }
        delete newItem['.key']
        return newItem
      }))
    },
    tryRemoveFile (path) {
      this.modal.mode = 'remove-file'
      this.modal.show = true
      this.modal.data = {}
      this.modal.data.path = path
      this.modal.data.file = this.files.filter((file) => {
        return file.path === path
      })[0]
      this.modal.data.content = this.modal.data.file.content
    },
    removeFile (path) {
      var file = this.files.filter((file) => {
        return file.path === path
      })[0]

      if (file.content === this.current.file.content) {
        this.current.file = this.files[0]
      }

      var index = this.files.indexOf(file)
      if (index !== -1) {
        this.files.splice(index, 1)
      }

      var ref = this.getZoneRef()
      ref.child('files').child(file['.key']).remove()
      this.saveFiles()
    },
    renameFile (newFile) {
      console.log(newFile)
      var currentFile = this.current.file = this.files.filter((eFile) => {
        return eFile.path === newFile.path
      })[0]
      currentFile.name = newFile.name
      currentFile.path = currentFile.path.replace(newFile.oldFileName, newFile.name)
      this.saveFiles()
    },
    selectFile (file) {
      console.log(file)
      this.saveFiles({ skip: true })
      this.current.file = this.files.filter((eFile) => {
        return eFile.path === file.path
      })[0]
    },
    getZoneRef () {
      return api.db.ref().child('/vuejs').child(this.getUID()).child(this.getZID())
    },
    saveFiles ({ skip }) {
      console.log(this.current.file)

      var ref = this.getZoneRef()

      // ref.child('files').set(this.files.map((item) => {
      //   var newItem = {
      //     ...item
      //   }
      //   delete newItem['.key']
      //   return newItem
      // })).then(() => {
      //   ref.child('refresher').set(Math.random())
      // })

      this.loading = true
      var newData = {
        ...this.current.file
      }
      delete newData['.key']
      ref.child('files').child(this.current.file['.key']).set(newData).then(() => {
        if (skip) {
          this.loading = false
          return
        }
        axios.post(this.getPreviewURL(), {
          zone: { }
        }).then((res) => {
          console.log(res)
          ref.child('refresher').set(Math.random())
          this.loading = false
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
$height: calc(100% - 50px);

.editor{
  width: 100%;
  height: $height;
  position: relative;
}
.left-side{
  position: absolute;
  top: 0px;
  left: 0px;
  width: 250px;
  height: $height;
}
.right-side{
  position: absolute;
  right: 0px;
  top: 0px;
  width: calc(100% - 250px);
  height: $height;
}
.modal{
  position: fixed;
  z-index: 100000000;
}

.menu{
  height: 47px;
  box-sizing: border-box;
  // border-bottom: #676767 solid 3px;
}

@keyframes simsim {
  0% {
    background-position: 0% 0%;
  }
  50%{
    background-position: 100% 100%;
  }
  100%{
    background-position: 0% 0%;
  }
}

.loader{
  height: 3px;
  background: linear-gradient(90deg, lime, cyan, #ff00ff);
  background-size: 250% 250%;
  transition: background-position 1s;
  &.loading{
    animation: simsim 3s ease-in-out 0s infinite normal both;
  }
}
</style>
