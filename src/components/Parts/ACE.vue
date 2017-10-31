<template>
  <div :style="{height: height ? px(height) : '100%',width: width ? px(width) : '100%'}">
  </div>
</template>

<script>
var ace = require('brace')
require(['emmet/emmet'], function (data) {
  window.emmet = data.emmet
})

export default {
  template: '',
  props: {
    value: {},
    lang: String,
    theme: String,
    height: true,
    width: true
  },
  data () {
    return {
      editor: null,
      contentBackup: ''
    }
  },
  methods: {
    px (n) {
      if (/^\d*$/.test(n)) {
        return n + 'px'
      }
      return n
    }
  },
  watch: {
    value (val) {
      if (this.contentBackup !== val) {
        this.editor.setValue(val, 1)
      }
    },
    lang () {
      this.editor.getSession().setMode('ace/mode/' + this.lang)
    }
  },
  mounted () {
    var vm = this
    var lang = this.lang || 'text'
    var theme = this.theme || 'chrome'

    require('brace/ext/emmet')

    var editor = vm.editor = ace.edit(this.$el)

    var commands = [
      {
        name: 'save',
        bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
        exec: (editor) => {
          var val = editor.getValue()
          this.$emit('save', val)
        },
        readOnly: true // false if this command should not apply in readOnly mode
      },

      {
        name: 'multicursor',
        bindKey: {win: 'Ctrl-D', mac: 'Command-D'},
        exec: (editor) => {
          editor.selectMore(1)
        },
        // multiSelectAction: 'forEach',
        scrollIntoView: 'cursor',
        readOnly: true // false if this command should not apply in readOnly mode
      }
    ]
    if (Array.isArray(commands)) {
      commands.forEach((command) => {
        vm.editor.commands.addCommand(command)
      })
    }

    this.$emit('init', editor)

    editor.$blockScrolling = Infinity
    editor.setOption('enableEmmet', true)
    editor.getSession().setMode('ace/mode/' + lang)
    editor.setTheme('ace/theme/' + theme)
    editor.setValue(this.value, 1)

    editor.on('change', function () {
      var content = editor.getValue()
      vm.$emit('input', content)
      vm.contentBackup = content
    })
  }
}
</script>

<style>

</style>
