<template>
  <div class="shader-controls">
    <h3>Shader Controls</h3>

    <div class="control-group">
      <label for="brightness">Brightness: {{ brightness }}</label>
      <input 
        type="range" 
        id="brightness" 
        v-model="brightness" 
        min="0" 
        max="2" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>

    <div class="control-group">
      <label for="saturation">Saturation: {{ saturation }}</label>
      <input 
        type="range" 
        id="saturation" 
        v-model="saturation" 
        min="0" 
        max="2" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>

    <div class="control-group">
      <label for="highlightPosition">highlightPosition: {{ highlightPosition }}</label>
      <input 
        type="range" 
        id="highlightPosition" 
        v-model="highlightPosition" 
        min="0.001" 
        max="1" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>

    <div class="control-group">
      <label for="highlightIntensity">highlightIntensity: {{ highlightIntensity }}</label>
      <input 
        type="range" 
        id="highlightIntensity" 
        v-model="highlightIntensity" 
        min="0.01" 
        max="2" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>

    <div class="control-group">
      <label for="envMapIntensity">envMapIntensity: {{ envMapIntensity }}</label>
      <input 
        type="range" 
        id="envMapIntensity" 
        v-model="envMapIntensity" 
        min="0.01" 
        max="2" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>

    <div class="control-group">
      <label for="IOR">IOR: {{ IOR }}</label>
      <input 
        type="range" 
        id="IOR" 
        v-model="IOR" 
        min="0.01" 
        max="20" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>
    <div class="control-group">
      <label for="subSurfaceScatter">subSurfaceScatter: {{ subSurfaceScatter }}</label>
      <input 
        type="range" 
        id="subSurfaceScatter" 
        v-model="subSurfaceScatter" 
        min="0.01" 
        max="20" 
        step="0.001"
        @input="updateShaderUniforms"
      />
    </div>

    <button @click="resetValues">Reset</button>
    <button @click="emitChanges">Emit</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

defineOptions({
  name: 'UniformEditor'
})
const props = defineProps({
  honeyMeshes: Object,
  honeyMaterial: Object,
  defaultBrightness: {
    type: Number,
    default: 1.0
  },
  defaultSaturation: {
    type: Number,
    default: 1.0
  }
});

const brightness = ref(1);
const saturation = ref(1);

const highlightPosition = ref(1);
const highlightIntensity = ref(1);

const envMapIntensity = ref(1);
const IOR = ref(1);

const subSurfaceScatter = ref(1);
let copies = []

let mesh450;
watch(() => props.honeyMeshes, (val) => {
  // console.log("RECEIEVEEEEEEEEEEEEEEEEEEEEEEEEEED", val)
  mesh450 = val['150g']
  if(mesh450?.material.uniforms){
    brightness.value = mesh450.material.uniforms.brightness.value;
    saturation.value = mesh450.material.uniforms.saturation.value;
    highlightPosition.value = mesh450.material.uniforms.highlightPosition.value;
    highlightIntensity.value = mesh450.material.uniforms.highlightIntensity.value;
    envMapIntensity.value = mesh450.material.uniforms.envMapIntensity.value;
    IOR.value = mesh450.material.uniforms.IOR.value;
    subSurfaceScatter.value = mesh450.material.uniforms.subSurfaceScatter.value;
  }
},{ immediate: true })
// Update the shader uniforms when the sliders change
const updateShaderUniforms = () => {
  // console.log("MESH450:", mesh450)
  if (mesh450.material && mesh450.material.uniforms) {
    mesh450.material.uniforms.brightness.value = brightness.value;
    mesh450.material.uniforms.saturation.value = saturation.value;
    mesh450.material.uniforms.highlightPosition.value = highlightPosition.value;
    mesh450.material.uniforms.highlightIntensity.value = highlightIntensity.value;
    mesh450.material.uniforms.envMapIntensity.value = envMapIntensity.value;
    mesh450.material.uniforms.IOR.value = IOR.value;
    mesh450.material.uniforms.subSurfaceScatter.value = subSurfaceScatter.value;
  }
};
function emitChanges(){
    emits('update:brightness', brightness.value);
    emits('update:saturation', saturation.value);
}
// Reset values to defaults
const resetValues = () => {
  brightness.value = 1;
  saturation.value = 1;
  updateShaderUniforms();
};

const emits = defineEmits(['update:brightness', 'update:saturation']);

// Watch for changes to the material and update controls if needed
// watch(() => props.honeyMaterial, (newMaterial) => {
//   if (newMaterial && newMaterial.uniforms) {
//     brightness.value = newMaterial.uniforms.brightness.value;
//     saturation.value = newMaterial.uniforms.saturation.value;
//   }
// }, { deep: true });

onMounted(() => {
  // Initialize with current material values if available
  // if (props.honeyMaterial && props.honeyMaterial.uniforms) {
  //   brightness.value = props.honeyMaterial.uniforms.brightness.value;
  //   saturation.value = props.honeyMaterial.uniforms.saturation.value;
  // }
});
</script>

<style lang="scss" scoped>
.shader-controls {
  position: absolute;
  top: 10px;
  left: 800px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 8px;
  width: 500px;
  z-index:20000;
}

.control-group {
  margin-bottom: 10px;
}

input[type="range"] {
  width: 100%;
  margin-top: 5px;
}

button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #45a049;
}
</style>