export default{
  useImage (url) {
      console.log("IMPORT META", url, `@/assets/${url}`)
      return new URL(`@/assets/${url}`, import.meta.url).href;
  }
}