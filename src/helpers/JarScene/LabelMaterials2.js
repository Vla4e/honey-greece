// createWipeMaterials.js

import * as THREE from 'three';

/**
 * Creates an array of { material, size } each with
 *   - Built-in PBR lighting from MeshStandardMaterial
 *   - A wipe transition from a "current" texture to "next" texture
 *
 * @param {Array} previousTextures - Array of objects, e.g. [{ texture, size, name }, ...]
 * @param {Array} nextTextures - Array of objects, same length/size order as previous
 * @param {THREE.CubeTexture|THREE.Texture} envMap - Environment map from your scene
 * @param {Object} materialProps - Material properties from your "clonedProperties"
 * @param {boolean} [usePhysical=false] - Whether to use MeshPhysicalMaterial
 * @returns {Array} - Array of objects like [{ material, size }, ...]
 */
export function createWipeMaterial(
  previousTextures,
  nextTextures,
  envMap,
  materialProps,
  usePhysical = false
) {
  // Guard: If nextTextures is empty, default to same as previous
  if (!nextTextures || !nextTextures.length) {
    nextTextures = previousTextures;
  }

  // We assume previousTextures and nextTextures align by index:
  // e.g. previousTextures[i].size === nextTextures[i].size
  return previousTextures.map((prevItem, index) => {
    const nextItem = nextTextures[index];

    // 1) Create a built-in PBR material
    const baseParams = {
      map:        prevItem.texture,              // "From" texture
      envMap:     envMap,
      roughness:  materialProps?.roughness ?? 0.5,
      metalness:  materialProps?.metalness ?? 0.0,
      transparent: true,      // or false if using alphaTest only
      alphaTest: 0.5  
      // color: materialProps.color,
      // normalMap: materialProps.normalMap,
      // emissiveMap: materialProps.emissiveMap
    };

    // MeshStandardMaterial vs MeshPhysicalMaterial
    const material = usePhysical
      ? new THREE.MeshPhysicalMaterial(baseParams)
      : new THREE.MeshStandardMaterial(baseParams);

    // 2) Store nextTexture + a transition uniform in userData
    material.userData.nextTexture = { value: nextItem.texture };
    material.userData.transitionProgress = { value: 0.0 };

    // 3) Use onBeforeCompile to inject the wipe logic
    material.onBeforeCompile = (shader) => {
      
      if (!shader.defines) shader.defines = {};
      shader.defines.USE_UV = ''; 
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        // Make sure we explicitly do: vUv = uv;
        vUv = uv;
        `
      );
      
      // Add our uniforms
      shader.uniforms.nextTexture = material.userData.nextTexture;
      shader.uniforms.transitionProgress = material.userData.transitionProgress;

      // Insert uniform declarations
      shader.fragmentShader = `
        uniform sampler2D nextTexture;
        uniform float transitionProgress;
        ${shader.fragmentShader}
      `;

      // In the built-in PBR shader, the map is sampled inside
      // "#include <map_fragment>".
      // We replace that chunk with a snippet that does the wipe.
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
    
        vec4 nextColor = texture(nextTexture, vUv);
        diffuseColor = mix(diffuseColor, nextColor, transitionProgress);
        `
      );
    };

    return { material, size: prevItem.size };
  });
}
