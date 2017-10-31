<template>
  <div>
    <Modal :show="modal.show"  @close="(v) => { modal.show = v }">
      <div v-if="modal.mode === 'remove-file'">
        <h1>Remove </h1>
        <h2>{{ modal.path }}</h2>
        <button @click="removeFile(modal.path); modal.show = false">Confirm Removal</button>
      </div>
    </Modal>
    <TreeFolder :files="files" :buttons="true"  @add="addFile" @remove="tryRemoveFile" @edit="editFile" />
  </div>
</template>

<script>
import TreeFolder from '@/components/Parts/TreeFolder.vue'
import Modal from '@/components/Parts/Modal.vue'
export default {
  components: {
    TreeFolder,
    Modal
  },
  data () {
    return {
      modal: {
        show: false,
        mode: 'remove-file',
        path: ''
      },
      newFile: {
        path: '',
        content: ''
      },
      files: [
        {
          path: '/main.js',
          content: '//hello'
        },
        {
          path: '/main2.js',
          content: '//hello'
        },
        {
          path: '/pages/App.vue',
          content: 'App'
        },
        {
          path: '/img/svg/image.svg',
          content: 'SVG'
        },
        {
          path: '/parts/Counter.vue',
          content: 'Counts'
        }
      ]
    }
  },
  computed: {
    readNewFiles () {
      return [
        ...this.files,
        { ...this.newFile }
      ]
    }
  },
  methods: {
    addFile (path) {
      this.files.push({
        path,
        content: ''
      })
    },
    tryRemoveFile (path) {
      this.modal.mode = 'remove-file'
      this.modal.show = true
      this.modal.path = path
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
      currentFile.path = currentFile.path.replace(newFile.oldFileName, newFile.name)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
