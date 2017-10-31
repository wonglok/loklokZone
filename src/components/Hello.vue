<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <router-link to="/login">Login</router-link>
  </div>
</template>

<script>
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to lok\'s coding zone.'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
