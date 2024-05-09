import router from '@/router';
export default {
  useImage (url) {
      console.log("IMPORT META", url, `@/assets/${url}`)
      return new URL(`@/assets/${url}`, import.meta.url).href;
  },
  delayedNavigation(path, delay) {
    console.log("this router", router)
    setTimeout(() => {
      router.push(path);
    }, delay);
  }
}