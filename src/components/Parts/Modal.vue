<template>
<div class="modal" v-if="showModal">
  <div class="modal-pos">
    <div class="blackbox" @click="() => { $emit('close', false); showModal = false }">
    </div>
    <div class="content scrollable">
      <slot />
    </div>
  </div>
</div>
</template>

<script>
export default {
  props: {
    show: {
    }
  },
  data () {
    return {
      showModal: false
    }
  },
  mounted () {
    this.showModal = this.show
  },
  watch: {
    show () {
      this.showModal = this.show
    }
  }
}
</script>

<style scoped>
.modal{
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-pos{
  width: 100%;
  height: 100%;
  position: relative;
}
.blackbox{
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0px;
  left: 0px;
  background-color: rgba(0,0,0,0.8);
}
.content{
  width: 90vmin;
  height: 90vmin;
  position: absolute;
  top: calc((100% - 90vmin) / 2);
  left: calc((100% - 90vmin) / 2);
  background-color: white;
}
.scrollable{
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
