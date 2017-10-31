<template>
<div class="pad">
  <div :key="branch" v-for="(detail, branch) in tree">
    <div v-if="detail && branch === 'files'" >
      <div :key="fkey" v-for="(file, fkey) in detail" class="filename">
        <div v-if="currentRename === file.name" >
          <input autofocus class="new-file-name" v-model="file.name" @keydown.enter="editFile(file)" @keydown.esc="currentRename = false" />
          <button class="btn file-renamer-cancel" @click="currentRename = false">cancel</button>
        </div>
        <div v-if="currentRename !== file.name">
          <span class="file-name-display" @click="selectFile(file)" :class="{ highlight: highlight.path === file.path }">{{ file.name }}</span>
          <button class="btn file-renamer" @click="currentRename = file.name">name</button>
          <button class="btn file-remover" @click="removeFile(file.path)" v-if="!file.protected">x</button>
        </div>
      </div>
      <div class="top-padding"></div>
    </div>
    <div v-if="branch.indexOf('/') === 0">
      <div class="foldername">
        {{ branch }}
        <button class="btn file-adder" @click="addFileAt(detail.folder, 'new.js')">+ file</button>
        <button class="btn folder-adder" @click="addFileAt(detail.folder, '/folder/new.js')">+ folder</button>
        <div class="pad" v-if="showAdderAt(detail.folder)">
          <input class="new-file-name" v-model="currentFileName" @keyup.enter="addFile()" /> <button class="btn newfile-btn" @click="addFile()">add</button>
          <button class="btn newfile-btn-close" @click="cancelAdd()">cancel</button>
        </div>
      </div>
      <Branch :buttons="buttons" :tree="detail" :highlight="highlight" @add="(v) => { $emit('add', v) }" @remove="(v) => { $emit('remove', v) }" @edit="(v) => { $emit('edit', v) }" @select="(v) => { $emit('select', v) }" />

    </div>
  </div>
</div>
</template>

<script>
import Branch from './Branch.vue'
export default {
  name: 'Branch',
  data () {
    return {
      currentRename: false,
      currentFileName: '',
      currentNewFolder: false
    }
  },
  props: {
    highlight: {
      default () {
        return {
          path: ''
        }
      }
    },
    buttons: { default: true },
    level: { default: 0 },
    tree: {}
  },
  beforeCreate () {
    this.$options.components.Branch = Branch
  },
  computed: {

  },
  methods: {
    showAdderAt (folder) {
      var addon = '/'
      if (folder === '/') {
        addon = ''
      }
      return this.currentNewFolder === folder + addon
    },
    addFileAt (folder, init) {
      var addon = '/'
      if (folder === '/') {
        addon = ''
      }
      this.currentFileName = init || ''
      this.currentNewFolder = folder + addon
    },
    addFile () {
      if (this.currentFileName.indexOf('/') === 0) {
        this.currentFileName = this.currentFileName.replace('/', '')
      }
      this.$emit('add', this.currentNewFolder + this.currentFileName)
      this.currentNewFolder = false
    },
    cancelAdd () {
      this.currentNewFolder = false
    },
    removeFile (path) {
      this.$emit('remove', path)
    },
    syncFileName () {
      this.$forceUpdate()
    },
    editFile (file) {
      this.$emit('edit', {
        ...file,
        oldFileName: this.currentRename
      })
      this.currentRename = false
    },
    selectFile (file) {
      this.currentSelect = file.path
      this.$emit('select', file)
    }
  }
}
</script>

<style lang="scss" scoped>
.pad{
  padding-left: 20px;
}
.file-remover{
	background-color: red;
  color:#ffffff;

  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 3px 10px;
	text-decoration:none;
  display: none;
}
.filename:hover .file-remover{
  display: inline-block;
}
.btn{
  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 4px 10px;
	text-decoration:none;
}
.file-adder{
  background-color: lime;
  color:black;

  display: none;
}
.folder-adder{
  background-color: greenyellow;
  color:black;

  display: none;
}
.foldername:hover .file-adder{
  display: inline-block;
}
.foldername:hover .folder-adder{
  display: inline-block;
}

.file-renamer{
  background-color: cyan;
  color:black;

  display: none;
}
.filename:hover .file-renamer{
  display: inline-block;
}

.newfile-btn{
  background-color: lime;
  color:black;
}
.newfile-btn-close{
  background-color: silver;
  color:black;
}

.file-renamer-cancel{
  background-color: silver;
  color:black;
}

.new-file-name {
  display: inline-block;
  margin: 0;
  font-size: 12px;
  appearance: none;
  box-shadow: none;
  border: black solid 1px;
  border-radius: none;
  width: 120px;
}
.new-file-name:focus {
  outline: none;
}
.file-name-display{
  text-decoration: underline;
  cursor: pointer;
}

.top-padding{
  height: 15px;
}

.highlight{
  color: red;
}

</style>
