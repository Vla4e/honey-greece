import WebGL from 'three/addons/capabilities/WebGL.js';


export async function checkCapabilities() {
  if ( WebGL.isWebGL2Available() ) {
    return true
  } else {
    console.error("WEBGL2 UNAVAILABLE")
    const warning = WebGL.getWebGL2ErrorMessage();
    document.getElementById( 'container' ).appendChild( warning );
    console.error(warning)
    return false
  }
}