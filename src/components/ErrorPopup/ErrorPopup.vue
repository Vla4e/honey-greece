<script setup>
import { onMounted, ref, inject, onBeforeMount, toRaw, watch, reactive } from 'vue';

defineOptions({
  name:"ErrorPopup"
})
defineProps({
  showPopup: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emitter = inject('emitter');
let errorResponse = reactive({
  message: 'Oops, an error has occurred. Please contact us at info@dolopia.eu if you have any problems using the website.'
});
let showError = ref(false);

function mountErrorObject(error){
  console.log("Error POPUP OBJ:", error)
  errorResponse = error;
  console.log(toRaw(errorResponse))
}
function closeError(){
  showError.value = false;
  errorResponse = {};
}

watch(() => errorResponse, (newVal) => {
  console.log("errorResponse errorPopup WATCHER::", newVal)
}, { immediate: true })

watch(() => showError.value, (newVal) => {
  console.log("SHOW ERROR VAL", newVal)
}, { immediate: true })

onBeforeMount(() => {
  console.log("MOUNTED ERROR POPUP :::::::::::")
})
onMounted(() => {
  emitter.on('showErrorPopup', (val) => {
    console.log("Showing Error Popup")
    showError.value = val;
  })
  emitter.on("mountErrorObject", mountErrorObject)
})
</script>


<template>
  <div v-if="showError" class="error-popup">
    <!-- <span class="error-heading">Error:</span> -->
    <ErrorMessage :error="errorResponse"/>
    
    <svg @click="closeError()" class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6L18 18M6 18L18 6" stroke="#131313" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</template>


<style lang="scss" scoped>
.error-popup{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-items: flex-start;
  padding: 15px;
  min-width: 200px;
  // min-height: 100px;
  max-width: 400px;
  background-color: white;
  box-shadow: 5px 5px 10px 3px #00000026;
  z-index: 100000;
  .error-heading{
    font-family: 'DMSans';
    font-weight: 400;
    font-size: 18px;
    color: black;
  }
  .close-icon{
    position: absolute;
    height: 20px;
    width: 20px;
    top: 2px;
    right: 2px;
  }
}
</style>