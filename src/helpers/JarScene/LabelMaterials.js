// textureShader.js
import { ShaderMaterial, Vector3, DoubleSide } from 'three';

// Shared shader code
const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying float vSide;

  void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      vec3 transformedNormal = normalMatrix * normal;
      vNormal = normalize(transformedNormal);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
      
      vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
  }
`;

const FRAGMENT_SHADER = `
  #define PI 3.14159265359

  uniform float transitionProgress;
  uniform sampler2D currentTexture;
  uniform sampler2D nextTexture;
  uniform samplerCube envMap;
  uniform float roughness;
  uniform float metalness;
  uniform vec3 baseColor;
  uniform float envMapIntensity;
  uniform float uExposure;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying float vSide;

  // ACES tone mapping function
  vec3 ACESFilm(vec3 x) {
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }
  
  // Schlick approximation for Fresnel
  vec3 F_Schlick(float cosTheta, vec3 F0) {
      return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }
  
  // Function to sample environment with roughness
  // Compatible with both WebGL 1.0 and 2.0
  vec3 getEnvColor(samplerCube envMap, vec3 direction, float roughness) {
      #ifdef GL_EXT_shader_texture_lod
          // WebGL 2.0 path - use LOD for roughness
          float mipLevel = roughness * 8.0; // Assuming mip chain depth of 8
          return textureCubeLodEXT(envMap, direction, mipLevel).rgb;
      #else
          // WebGL 1.0 fallback - simple sample (less accurate for rough materials)
          return textureCube(envMap, direction).rgb;
      #endif
  }

  void main() {
      // Basic texture blending for the wipe effect
      float alpha = step(vUv.x, transitionProgress);
      vec4 texColorCurrent = texture2D(currentTexture, vUv);
      vec4 texColorNext = texture2D(nextTexture, vUv);
      vec4 texColor = mix(texColorCurrent, texColorNext, alpha);
      
      // Get base color with texture
      vec3 albedo = texColor.rgb;
      
      // Basic lighting setup
      vec3 N = normalize(vNormal) * vSide;
      vec3 V = normalize(vViewPosition);
      vec3 R = reflect(-V, N);
      float NoV = max(dot(N, V), 0.0);
      
      // Specular reflection
      vec3 F0 = mix(vec3(0.04), albedo, metalness);
      vec3 F = F_Schlick(NoV, F0);
      
      // Sample environment for reflection with proper roughness
      vec3 prefilteredColor = getEnvColor(envMap, R, roughness);
      
      // Sample environment diffuse (simplified)
      vec3 diffuseLight = getEnvColor(envMap, N, 1.0) * 0.5;
      
      // Calculate diffuse and specular contributions
      vec3 diffuse = albedo * (1.0 - metalness) * diffuseLight;
      vec3 specular = prefilteredColor * F;
      
      // Combine components with energy conservation
      vec3 finalColor = (diffuse + specular) * envMapIntensity;
      
      // Ensure we have some minimal lighting (ambient term)
      finalColor = max(finalColor, albedo * 0.3);
      
      // Apply exposure adjustment
      finalColor *= uExposure;
      
      // Apply ACES tone mapping for HDR
      finalColor = ACESFilm(finalColor);
      
      // Convert from linear to sRGB space
      finalColor = pow(finalColor, vec3(1.0/2.2));
      
      gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

/**
 * Creates a shader material for texture transitions
 * @param {Object} options - Configuration options
 * @param {Object} options.currentTexture - Current texture object
 * @param {Object} options.nextTexture - Next texture object
 * @param {Object} options.envMap - Environment map for reflections
 * @param {Object} options.materialProps - Base material properties 
 * @returns {ShaderMaterial} - Created shader material
 */
function createMaterial(options) {
  const { currentTexture, nextTexture, envMap, materialProps } = options;
  
  console.log("Material props:", materialProps)
  console.log("Env map:", envMap)
  const material = new ShaderMaterial({
    uniforms: {
      currentTexture: { value: currentTexture },
      nextTexture: { value: nextTexture },
      transitionProgress: { value: 0 },
      envMap: { value: envMap },
      roughness: { value: materialProps.roughness || 0.5 },
      metalness: { value: materialProps.metalness || 0.0 },
      baseColor: { value: materialProps.color || new Vector3(1, 1, 1) },
      envMapIntensity: { value: materialProps.envMapIntensity || 1.0 },
      uExposure: { value: materialProps.exposure || 1.0 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    alphaTest: 0.05,
    side: DoubleSide,
  });
  
  return material;
}

/**
 * Creates texture shader materials for label meshes
 * @param {Array} previousTextures - Array of previous texture objects
 * @param {Array} nextTextures - Array of next texture objects
 * @param {Object} materialProperties - Properties from original material
 * @param {Object} envMap - Environment map for lighting
 * @returns {Array} - Array of materials with size information
 */
export async function createLabelMaterial(previousTextures, nextTextures, materialProperties, envMap) {
  // Set proper encoding for textures
  if (previousTextures[0].texture.encoding !== undefined) {
    previousTextures.forEach(item => {
      if (item.texture && item.texture.encoding !== undefined) {
        item.texture.encoding = THREE.SRGBColorSpace;
      }
    });
    
    nextTextures.forEach(item => {
      if (item.texture && item.texture.encoding !== undefined) {
        item.texture.encoding = THREE.SRGBColorSpace;
      }
    });
  }
  
  // Create shared material properties
  console.log("MATPROPS COLOR=====>", materialProperties.color)
  const materialProps = {
    roughness: materialProperties?.roughness || 0.5,
    metalness: materialProperties?.metalness || 0.0,
    color: materialProperties?.color || new Vector3(1, 1, 1),
    envMapIntensity: 1.0,
    exposure: 1.0
  };
  
  // Create materials for each texture size
  return previousTextures.map((item, index) => {
    const material = createMaterial({
      currentTexture: item.texture,
      nextTexture: nextTextures[index].texture,
      envMap: envMap,
      materialProps: materialProps
    });
    
    return { material, size: item.size };
  });
}

// CLAUDE PROVIDED
// async function createTextureShader(previousTexture, nextTexture, clonedProperties) {
//   // Copy glb mesh properties into shader
//   previousTexture[0].texture.encoding = SRGBColorSpace;
//   nextTexture[0].texture.encoding = SRGBColorSpace;

//   // previousTexture[0].texture.colorSpace = SRGBColorSpace;
//   // nextTexture[0].texture.colorSpace = SRGBColorSpace;
//   let tempEnv = globalScene.environment;
//   let originalMaterial = clonedProperties;
//   let baseColor = originalMaterial.color;
//   let roughness = originalMaterial.roughness;
//   let metalness = originalMaterial.metalness;
//   let material = new ShaderMaterial({
//     uniforms: {
//       currentTexture: { value: previousTexture[0].texture },
//       nextTexture: { value: nextTexture[0].texture },
//       transitionProgress: { value: 0 },
//       envMap: { value: globalScene.environment },
//       roughness: { value: roughness },
//       metalness: { value: metalness },
//       baseColor: { value: baseColor },
//       envMapIntensity: { value: 1 },
//       side: DoubleSide,
//     },
//     vertexShader: `
//       varying vec2 vUv;
//       varying vec3 vNormal;
//       varying vec3 vViewPosition;
//       varying vec3 vWorldPosition;
//       varying float vSide;

//       void main() {
//           vUv = uv;
//           vec4 worldPosition = modelMatrix * vec4(position, 1.0);
//           vWorldPosition = worldPosition.xyz;
          
//           vec3 transformedNormal = normalMatrix * normal;
//           vNormal = normalize(transformedNormal);
          
//           vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//           vViewPosition = -mvPosition.xyz;
//           gl_Position = projectionMatrix * mvPosition;
          
//           vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
//       }
//     `,
//     fragmentShader: `
//       #define PI 3.14159265359

//       uniform float transitionProgress;
//       uniform sampler2D currentTexture;
//       uniform sampler2D nextTexture;
//       uniform samplerCube envMap;
//       uniform float roughness;
//       uniform float metalness;
//       uniform vec3 baseColor;
//       uniform float envMapIntensity;

//       varying vec2 vUv;
//       varying vec3 vNormal;
//       varying vec3 vViewPosition;
//       varying float vSide;

//       void main() {
//           // Basic texture blending for the wipe effect
//           float alpha = step(vUv.x, transitionProgress);
//           vec4 texColorCurrent = texture2D(currentTexture, vUv);
//           vec4 texColorNext = texture2D(nextTexture, vUv);
//           vec4 texColor = mix(texColorCurrent, texColorNext, alpha);
          
//           // Get base color with texture
//           vec3 color = texColor.rgb;  // Removed baseColor multiplication for now
          
//           // Basic lighting setup
//           vec3 N = normalize(vNormal) * vSide;
//           vec3 V = normalize(vViewPosition);
//           vec3 R = reflect(-V, N);
          
//           // Sample environment map
//           vec3 envSample = textureCube(envMap, R).rgb;
          
//           // Simplified lighting calculation
//           float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
//           vec3 specularColor = mix(vec3(0.04), color, metalness);
          
//           // Mix diffuse and specular
//           vec3 diffuse = color * (1.0 - metalness);
//           vec3 specular = envSample * mix(specularColor, vec3(1.0), fresnel);
          
//           // Combine everything
//           vec3 finalColor = (diffuse + specular * (1.0 - roughness)) * envMapIntensity;
          
//           // Ensure we have some minimal lighting
//           finalColor = max(finalColor, color * 0.2);  // Add ambient term
          
//           gl_FragColor = vec4(finalColor, texColor.a);
//       }
//     `,

//     transparent: true,
//     alphaTest: 0.05,
//     // Adjust this value as needed
//   });

//   let material2 = new ShaderMaterial({
//     uniforms: {
//       currentTexture: { value: previousTexture[1].texture }, // Start with the first texture
//       nextTexture: { value: nextTexture[1].texture }, // Initially set to the second texture
//       transitionProgress: { value: 0 }, // Transition not started
//       envMap: { value: globalScene.environment },
//       roughness: { value: roughness },
//       metalness: { value: metalness },
//       baseColor: { value: baseColor },
//       envMapIntensity: { value: 1 },
//       // exposure: {value: 0.2},
//       side: DoubleSide,
//     },
//     vertexShader: `
//       varying vec2 vUv;
//       varying vec3 vNormal;
//       varying vec3 vViewPosition;
//       varying vec3 vWorldPosition;
//       varying float vSide;

//       void main() {
//           vUv = uv;
//           vec4 worldPosition = modelMatrix * vec4(position, 1.0);
//           vWorldPosition = worldPosition.xyz;
          
//           vec3 transformedNormal = normalMatrix * normal;
//           vNormal = normalize(transformedNormal);
          
//           vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//           vViewPosition = -mvPosition.xyz;
//           gl_Position = projectionMatrix * mvPosition;
          
//           vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
//       }
//     `,
//     fragmentShader: `#define PI 3.14159265359

//   uniform float transitionProgress;
//   uniform sampler2D currentTexture;
//   uniform sampler2D nextTexture;
//   uniform samplerCube envMap;
//   uniform float roughness;
//   uniform float metalness;
//   uniform vec3 baseColor;
//   uniform float envMapIntensity;

//   varying vec2 vUv;
//   varying vec3 vNormal;
//   varying vec3 vViewPosition;
//   varying float vSide;

//   void main() {
//       // Basic texture blending for the wipe effect
//       float alpha = step(vUv.x, transitionProgress);
//       vec4 texColorCurrent = texture2D(currentTexture, vUv);
//       vec4 texColorNext = texture2D(nextTexture, vUv);
//       vec4 texColor = mix(texColorCurrent, texColorNext, alpha);
      
//       // Get base color with texture
//       vec3 color = texColor.rgb;  // Removed baseColor multiplication for now
      
//       // Basic lighting setup
//       vec3 N = normalize(vNormal) * vSide;
//       vec3 V = normalize(vViewPosition);
//       vec3 R = reflect(-V, N);
      
//       // Sample environment map
//       vec3 envSample = textureCube(envMap, R).rgb;
      
//       // Simplified lighting calculation
//       float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
//       vec3 specularColor = mix(vec3(0.04), color, metalness);
      
//       // Mix diffuse and specular
//       vec3 diffuse = color * (1.0 - metalness);
//       vec3 specular = envSample * mix(specularColor, vec3(1.0), fresnel);
      
//       // Combine everything
//       vec3 finalColor = (diffuse + specular * (1.0 - roughness)) * envMapIntensity;
      
//       // Ensure we have some minimal lighting
//       finalColor = max(finalColor, color * 0.2);  // Add ambient term
      
//       gl_FragColor = vec4(finalColor, texColor.a);
//   }`,
//     transparent: true,
//     alphaTest: 0.05, // Adjust this value as needed
//   });
//   return [
//     { material: material, size: previousTexture[0].size },
//     { material: material2, size: previousTexture[1].size },
//   ];
// }