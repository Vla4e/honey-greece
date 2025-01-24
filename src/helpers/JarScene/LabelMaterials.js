// /* 
// Texture shader with wipe animation when switching between textures.
// Input is current (previousTexture) and upcoming (nextTexture), and label mesh.material object (clonedProperteis)
// */


// async function createTextureShader(previousTexture, nextTexture, clonedProperties){
//   // console.log("CALLED CTS func")
//   // Copy glb mesh properties into shader
//   previousTexture[0].texture.encoding = SRGBColorSpace;
//   nextTexture[0].texture.encoding = SRGBColorSpace;
//   let tempEnv = globalScene.environment
//   let originalMaterial = clonedProperties;
//   let baseColor = originalMaterial.color;
//   let roughness = originalMaterial.roughness;
//   let metalness = originalMaterial.metalness;
//   let material = new ShaderMaterial({
//     uniforms: {
//         currentTexture: { value: previousTexture[0].texture },
//         nextTexture: { value: nextTexture[0].texture },
//         transitionProgress: { value: 0 },
//         envMap: { value: globalScene.environment },
//         roughness: { value: roughness },
//         metalness: { value: metalness },
//         baseColor: { value: baseColor },
//         envMapIntensity: { value: 1 },
//         side: DoubleSide
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
//      // Adjust this value as needed
//   });

//   let material2 = new ShaderMaterial({
//     uniforms: {
//         currentTexture: { value: previousTexture[1].texture }, // Start with the first texture
//         nextTexture: { value: nextTexture[1].texture }, // Initially set to the second texture
//         transitionProgress: { value: 0 }, // Transition not started
//     envMap: { value: globalScene.environment },
//     roughness: { value: roughness },
//     metalness: { value: metalness },
//     baseColor: { value: baseColor },
//     envMapIntensity: { value: 1 },
//     // exposure: {value: 0.2},
//     side: DoubleSide
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
//     alphaTest: 0.05,  // Adjust this value as needed
//   });
//   // console.log("about to return mats")
//   return [
//     {material: material, size: previousTexture[0].size}, 
//     {material: material2, size: previousTexture[1].size}
//   ];
// }