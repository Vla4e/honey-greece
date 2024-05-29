import router from '@/router';

export function useImage (url) {
    console.log("IMPORT META", url, `@/assets/${url}`)
    return new URL(`@/assets/${url}`, import.meta.url).href;
}
export function delayedNavigation(path, delay) {
  console.log("this router", router)
  setTimeout(() => {
    router.push(path).catch(err => {
      console.log("error while routing", err)
    });
  }, delay);
}
export function debounce (func, wait) {
  let timeout;

  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
}