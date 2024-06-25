<template>
  <div class="color-picker-container">
    <input type="color" v-model="color" />
    <!-- <div class="color-display" :style="{ backgroundColor: color }"></div> -->
    <p>{{ color }}</p>
    <input type="text" v-model="color" />
    <button @click="emitApplyColor()">Apply Color</button>
  </div>
</template>


<script>
export default {
  name: 'ColorPicker'
}
</script>

<script setup>
import { ref, inject, watch, onMounted, onUnmounted } from 'vue';
let emitter = inject('emitter')
// Define a reactive variable for the selected color
const color = ref('#ff0000');
const colorText = ref('#ff0000')
watch(() => colorText.value, (newValue) => {
  // emitter.emit('applyColor', newValue)
  color.value = colorText.value
})
function emitApplyColor(){
  emitter.emit('applyColor', color.value)
}
onMounted(() => {
  emitter.on('switchColor', (value) => {
    console.log("switchcolor value", value)
    color.value = value
    colorText.value = value
    emitApplyColor();
  })
})

onUnmounted(() => {
  emitter.off('switchColor',)
})
</script>

<style scoped>

.color-picker-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #ffffff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

input[type="color"] {
    width: 100px;
    height: 50px;
    border: none;
    cursor: pointer;
}

.color-display {
    width: 100px;
    height: 100px;
    margin-top: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

p {
    margin-top: 10px;
    font-size: 16px;
    color: #333;
}
</style>
