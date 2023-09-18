export default{
  useImage (url) {
      return new URL(url, import.meta.url).href;
  }
}

