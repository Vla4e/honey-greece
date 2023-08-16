<template>
  <nav class="navbar">
    <div class="logo-container">
    </div>
    <div class="links-container">
      <label>
        Test
      </label>
      <label>
        Test2
      </label>
      <label>
        Test3
      </label>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar'
}
</script>

<style>
.navbar{
  display: flex;
  width: 100vw;
  min-height: 100px;
  background: transparent;
  border-bottom: 2px solid gray;
}
.logo-container{
  width: 64px;
  height: 64px;
  background: green;
}
.links-container{
  display: flex;
  flex-grow: 1;
  justify-content: space-around;
}
.links-container label {
  color: red;
  font-size: 16px;
}
</style>