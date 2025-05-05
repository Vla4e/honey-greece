<script setup>
import { onMounted, watch } from 'vue'

defineOptions({
  name:'ErrorMessage'
})

const props = defineProps({
  error:{
    type: Object,
    required: false,
    default: () => {
      return {
        error: '',
        statusCode: '',
        message: 'We had trouble verifying you’re not a bot. Please try again or contact us at info@premiumhoney.gr if the problem persists.'
      }
    }
  }
})

watch(() => props.error, (value) => {
  console.log("WATCHER ERROR PROP::::::::::", value)
}, { immediate: true })
onMounted(()=>{
  console.log("ErrorMessage MOUNTED")
})
</script>


<template>
  <div class="error-message-container">
    <img class="error-icon" src="@/assets/images/error.svg">
    <!-- <svg class="error-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v5a1 1 0 1 0 2 0V8Zm-1 7a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H12Z" clip-rule="evenodd"/>
    </svg> -->
    <span class="text">{{ error.message}}</span>
  </div>
</template>


<style lang="scss" scoped>
.error-message-container{
  display: flex;
  align-items: center;
  width: 100%;
  // border: 1px solid #c62939;
  padding: 5px;
  .error-icon{
    height: 24px;
    width: 24px;
    margin-right: 10px;
    fill: #c62939;
  }
  .text{
    color: #c62939;
    font-family: "DMSans";
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    text-align: left;
  }
}
</style>