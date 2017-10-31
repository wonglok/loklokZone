<template>
  <div>
    <div class="menu">
      Zone
      <a :href="`//${getBase()}/v1/vuejs/${getUID()}/${getZID()}/dist/index.html`" target="_blank">Preview</a>
    </div>
    <div class="editor">
      <div class="left-side">
        <TreeFolder :files="files" :buttons="true" :highlight="current.file" @add="addFile" @remove="tryRemoveFile" @edit="editFile" @select="selectFile" />
      </div>
      <div class="right-side">
        <ACE v-if="current.file.path" @save="saveFile" v-model="current.file.content" @init="editorInit()" :lang="getLang(current.file.path)" theme="chrome" width="100%" :height="ace.height"></ACE>
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
import TreeFolder from '@/components/Parts/TreeFolder.vue'
import Modal from '@/components/Parts/Modal.vue'
import ACE from '@/components/Parts/ACE.vue'
// import ACE from 'vue2-ace-editor'
import snippets from '@/../functions/snippets.js'

export default {
  components: {
    TreeFolder,
    Modal,
    ACE
  },
  data () {
    return {
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
        file: {}
      },
      files: false
    }
  },
  computed: {
    readNewFiles () {
      return [
        ...this.files,
        { ...this.newFile }
      ]
    },
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
    Promise.resolve([
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
    ]).then((v) => {
      window.v = v
      this.files = v
      this.current.file = v[0]
    })
  },
  methods: {
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
      var index = this.files.indexOf(file)
      if (index !== -1) {
        this.files.splice(index, 1)
      }
    },
    editFile (newFile) {
      console.log(newFile)
      var currentFile = this.files.filter((eFile) => {
        return eFile.path === newFile.path
      })[0]
      currentFile.name = newFile.name
      currentFile.path = currentFile.path.replace(newFile.oldFileName, newFile.name)
    },
    selectFile (file) {
      console.log(file)
      this.current.file = this.files.filter((eFile) => {
        return eFile.path === file.path
      })[0]
    },
    saveFile () {

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
  height: 50px;
  box-sizing: border-box;
  border-bottom: #676767 solid 3px;
}



</style>
