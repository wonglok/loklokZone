<template>
<div class="pad">
  <div :key="branch" v-for="(detail, branch) in tree">
    <div v-if="detail && branch === 'files'" >
      <div :key="fkey" v-for="(file, fkey) in detail" class="filename">
        <div v-if="currentRename === file.name" >
          <input autofocus class="new-file-name" v-model="file.name" @keydown.enter="editFile(file)" @keydown.esc="currentRename = false" />
          <button class="file-renamer-cancel" @click="currentRename = false">cancel</button>
        </div>
        <div v-if="currentRename !== file.name">
          <span>{{ file.name }}</span>
          <button class="file-renamer" @click="currentRename = file.name">edit</button>
          <button class="file-remover" @click="removeFile(file.path)">x</button>
        </div>
      </div>
    </div>
    <div v-if="branch.indexOf('/') === 0">
      <div class="foldername">
        {{ branch }}
        <button class="file-adder" @click="addFileAt(detail.folder, 'new.js')">+ file</button>
        <button class="file-adder" @click="addFileAt(detail.folder, '/folder/new.js')">+ folder</button>
        <div class="pad" v-if="showAdderAt(detail.folder)">
          <input class="new-file-name" v-model="oldFileName" @keyup.enter="addFile()" /> <button class="newfile-btn" @click="addFile()">add</button> <button class="newfile-btn-close" @click="cancelAdd()">cancel</button>
        </div>
      </div>
      <Branch :buttons="buttons" :tree="detail" :parent="branch" @add="(v) => { $emit('add', v) }" @remove="(v) => { $emit('remove', v) }" @edit="(v) => { $emit('edit', v) }" />
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
      oldFileName: '',
      currentNewFile: false
    }
  },
  props: {
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
      return this.currentNewFile === folder + addon
    },
    addFileAt (folder, init) {
      var addon = '/'
      if (folder === '/') {
        addon = ''
      }
      this.oldFileName = init || ''
      this.currentNewFile = folder + addon
    },
    addFile () {
      if (this.oldFileName.indexOf('/') === 0) {
        this.oldFileName = this.oldFileName.replace('/', '')
      }
      this.$emit('add', this.currentNewFile + this.oldFileName)
      this.currentNewFile = false
    },
    cancelAdd () {
      this.currentNewFile = false
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
.file-adder{
  background-color: lime;
  color:black;

  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 4px 10px;
	text-decoration:none;
  display: none;
}
.foldername:hover .file-adder{
  display: inline-block;
}

.file-renamer{
  background-color: cyan;
  color:black;

  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 4px 10px;
	text-decoration:none;
  display: none;
}
.filename:hover .file-renamer{
  display: inline-block;
}

.newfile-btn{
  background-color: lime;
  color:black;

  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 4px 10px;
	text-decoration:none;
}
.newfile-btn-close{
  background-color: silver;
  color:black;

  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 4px 10px;
	text-decoration:none;
}

.file-renamer-cancel{
  background-color: silver;
  color:black;

  border: red solid 0px;
	border-radius:3px;
	cursor:pointer;
	font-weight:bold;
	padding: 4px 10px;
	text-decoration:none;
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
</style>
