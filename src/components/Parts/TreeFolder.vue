<template>
<div>
  <div>
    <Branch :buttons="buttons" :highlight="highlight" :tree="tree" @add="(v) => { $emit('add', v) }" @remove="(v) => { $emit('remove', v) }" @edit="(v) => { $emit('edit', v) }" @select="(v) => { $emit('select', v) }" />
  </div>
  <!-- <pre>{{ tree }}</pre>
  <pre>{{ levels }}</pre> -->
</div>
</template>

<script>
import Branch from './Branch.vue'
export default {
  components: {
    Branch
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
    files: {}
  },
  data () {
    return {
    }
  },
  computed: {
    levels () {
      return (this.files || []).map((file) => {
        var path = file.path
        var pathArr = path.split('/')
        file.name = pathArr.pop()
        path = pathArr.join('/')

        file.levels = path.split('/').map((item) => {
          return '/' + item
        })

        return file
      })
    },
    tree () {
      var ans = this.levels.reduce((root, file, key) => {
        //

        var cursor = root
        file.levels.forEach((folder, atLevel) => {
          if (!cursor[folder]) {
            cursor[folder] = {}
          }
          cursor = cursor[folder]
          cursor.folder = file.levels.reduce((accu, item, key) => {
            if (key <= atLevel) {
              accu = accu + item
            }
            return accu
          }, '').replace('//', '/')

          if (atLevel === (file.levels.length - 1)) {
            if (!cursor.files) {
              cursor.files = []
            }
            let anotherFile = {
              ...file
            }
            delete anotherFile.levels
            cursor.files.push(anotherFile)
          }
        })

        //
        return root
      }, {})

      if (Object.keys(ans).length === 0) {
        ans = {
          '/': {
            folder: '/'
          }
        }
      }

      return ans
    }
  },
  methods: {

  }
}
</script>

<style>

</style>
