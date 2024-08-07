<template>
  <div v-if="true" class="loading-indicator">
    <div class="spinner"></div>
  </div>
</template>

<script>
export default {
  name: 'LoadingIndicator'
}
</script>
<script setup>
import { onMounted, ref } from 'vue';

const isLoading = ref(true);

onMounted(() => {
  // Simulate loading time (remove this in production)
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
});
</script>


<style lang="scss" scoped>
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  border: 4px solid rgba(48, 48, 48, 0.273);
  width: 90%;
  height: 90%;
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
