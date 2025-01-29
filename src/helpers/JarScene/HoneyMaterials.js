/* Honey Shader Materials */
import {
  Color,
  Vector3,
  ShaderMaterial,
  BufferAttribute
} from 'three';

/*
Below function takes a world position argument from predefined jar positions, 
which in turn affects shader calculations. This was done
due to a jar grid of jars with different matcap textures (IDs: 1 to 46) being used by the client to select
which combination of parameters + position in the world space (HDR calculations are severely affected by this)
is visually most fitting for the honey types they produce.
*/ 
import jarPositions from "@/assets/boxCenters.js"
import honeyPresets from '../../assets/honey-visuals/honeyParameterPresets';
async function honeyMaterialPositionInput(honeyMeshes, textureLoader, envMap, honeyType) {
  try{
    let honeyParameters = honeyPresets[honeyType]

    const honeyColor = new Color(honeyParameters.colorCode)
    const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);
  
    // 1. get current actual world position of the Honey Mesh
    // 2. get worldPosition of desired Honey from jar grid's saved worldPositions
    // 3. calculate offset from actual to grid position, to be used in calculations in shader 
    const worldPosMain = new Vector3();
    honeyMeshes['300g'].getWorldPosition(worldPosMain);
    const gridWorldPos = jarPositions[honeyParameters.matcapId].worldPosObj;
    const offset = new Vector3().subVectors(gridWorldPos, worldPosMain);
  
    console.log("worldPosMain:", worldPosMain);
    console.log("gridWorldPos:", gridWorldPos);
    console.log("Offset:", offset);
  
    return new ShaderMaterial({
      uniforms: {
        matcap:           { value: matcapTexture },
        colorAdjust:      { value: honeyColor },
        time:             { value: 0 }, //used in animation for flowing honey - thinking about removing
        envMap:           { value: envMap },
        IOR:              { value: honeyParameters.density },
        subSurfaceScatter:{ value: honeyParameters.light },
        viscosity:        { value: honeyParameters.viscosity },
        viscosityWaviness:{ value: honeyParameters.viscosityWaviness },
        highlightPosition:{ value: 0.50 },
        highlightIntensity:{ value: 0.50 },
        envMapIntensity:  { value: 1.0 }, //recommended 1
        //pass the offset
        offset:           { value: offset }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
  
        void main() {
          vNormal = normalize(normalMatrix * normal);
  
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
  
          // Store the actual world position of each vertex
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D matcap;
        uniform vec3 colorAdjust;
        uniform float time;
        uniform samplerCube envMap;
        uniform float envMapIntensity;
        uniform float IOR;
        uniform float subSurfaceScatter;
        uniform float viscosity;
        uniform float highlightIntensity;
        uniform float highlightPosition;
        uniform float viscosityWaviness;
  
        // The offset from the chosen grid jar
        uniform vec3 offset;
  
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
  
        // Example environment reflection function
        vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal, vec3 shiftedPos) {
          vec3 reflectVec = reflect(viewDir, normal);
  
          // Use the shifted position in the environment lookup
          // (You can experiment with how the offset is applied here.)
          vec3 envMapCoord = shiftedPos + reflectVec * 20.0;
          return textureCube(envMap, envMapCoord).rgb;
        }
  
        void main() {
          // SHIFT the position-based logic by the offset
          vec3 shiftedPos = vWorldPosition + offset;
  
          vec3 viewDir = normalize(vViewPosition);
          vec3 normal = normalize(vNormal);
  
          // Refraction
          vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
          vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
          vec3 matcapColor = texture2D(matcap, matcapUV).rgb;
  
          // Environment reflection with applied intensity factor
          vec3 reflColor = getEnvironmentReflection(viewDir, normal, shiftedPos) * envMapIntensity;
  
          // Fresnel effect (differing reflections on surface of honey)
          float fresnelPower = 3.0;
          float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);
  
          // Subsurface scattering approximation
          vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;
  
          // Viscosity simulation (subtle movement) using SHIFTED y
          float viscosityEffect = sin(shiftedPos.y * viscosityWaviness + time * 0.1) * viscosity;
          matcapColor += vec3(viscosityEffect);
  
          // Enhanced vertical highlight
          float verticalHighlight = smoothstep(
            highlightPosition - 0.1,
            highlightPosition + 0.1,
            abs(shiftedPos.y)
          );
          verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;
  
          // Blend colors with adjusted weights
          vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
          vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
  
          // Add scatter and highlight
          finalColor += scatterColor;
          finalColor += vec3(verticalHighlight);
  
          // Color depth simulation (again SHIFTED y)
          float depth = (shiftedPos.y + 1.0) * 0.5; 
          finalColor *= mix(vec3(1.0), colorAdjust, depth);
  
          // Enhance transparency effect with reduced environment map influence
          float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
          finalColor = mix(finalColor, reflColor, transparency * 0.2);
  
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
  } catch (e) {
    console.error("Oops, shader creation failed.")
  }
}



async function honeyMaterial(honeyMeshes, textureLoader, envMap, honeyType) {
  try {

    let honeyParameters = honeyPresets[honeyType]

    const honeyColor = new Color(honeyParameters.colorCode)
  
    // Load matcap texture
    const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);

    const fixedGridPositionl = new Vector3( 0.05, 0.2, 0)

    let material = new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor },
      time: { value: 0 },
      envMap: { value: envMap },
      IOR: { value: honeyParameters.density },
      subSurfaceScatter: { value: honeyParameters.light },
      viscosity: { value: honeyParameters.viscosity },
      viscosityWaviness: { value: honeyParameters.viscosityWaviness },
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1 },
      fixedGridPosition: { value: fixedGridPositionl } // New uniform
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 fixedGridPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform vec3 fixedGridPosition;
      uniform float time;
      uniform samplerCube envMap;
      uniform float envMapIntensity;
      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float highlightIntensity;
      uniform float highlightPosition;
      uniform float viscosityWaviness;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        // Use fixedGridPosition to determine the sampling direction, not as an offset
        vec3 samplingDir = normalize(fixedGridPosition + reflectVec);
        return textureCube(envMap, samplingDir).rgb;
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Refraction
        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        // Check matcapColor
        if (any(isnan(matcapColor)) || any(isinf(matcapColor))) {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          return;
        }

        // Environment reflection
        vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

        // Check reflColor
        if (any(isnan(reflColor)) || any(isinf(reflColor))) {
          gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
          return;
        }

        // Fresnel effect
        float fresnelPower = 3.0;
        float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

        // Subsurface scattering
        vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

        float viscosityEffect = sin(fixedGridPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(fixedGridPosition.y));
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        // Blend colors
        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;
        finalColor += vec3(verticalHighlight);

        float depth = (fixedGridPosition.y + 1.0) * 0.5;
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        // Transparency effect
        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        // Final check
        if (any(isnan(finalColor)) || any(isinf(finalColor))) {
          gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
          return;
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
      `
    });
    return material
  } catch (e) {
    console.log("Error while loading matcap texture", e)
  }
}

async function oldHoneyMaterial(textureLoader, environment, honeyType, jarSize){
  console.log("3. CALCULATING OLD MATCAP")
  let honeyParameters = honeyPresets[honeyType]
  
  const honeyColor = new Color(honeyParameters.colorCode)
  
  console.log("ID OF TEX:", honeyParameters.matcapId)
  // Load matcap texture
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);
  console.log("Applying matcap TEXTURE:", matcapTexture)
  let worldPosition = new Vector3(0.15000002, -0.1, 0.0)
  return new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor},
      time: { value: 0 },
      envMap: { value: environment },
      IOR: { value: honeyParameters.density},
      subSurfaceScatter: { value: honeyParameters.light},
      viscosity: { value: honeyParameters.viscosity},
      viscosityWaviness: { value: honeyParameters.viscosityWaviness},
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      idealPosition: { value: worldPosition }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform vec3 idealPosition;
      uniform float time;
      uniform samplerCube envMap;
      uniform float envMapIntensity;
      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float highlightIntensity;
      uniform float highlightPosition;
      uniform float viscosityWaviness;


      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = idealPosition + reflectVec * 20.0; // Adjust the 10.0 as needed
        return textureCube(envMap, envMapCoord).rgb;
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Refraction
        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        // Environment reflection with reduced intensity
        vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

        // Adjusted Fresnel effect
        float fresnelPower = 3.0;
        float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

        // Subsurface scattering approximation
        vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

        // Viscosity simulation (subtle movement)
        float viscosityEffect = sin(vWorldPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // Enhanced Vertical highlight
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vWorldPosition.y));
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        // Blend colors with adjusted weights
        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;

        // Apply vertical highlight more prominently
        finalColor += vec3(verticalHighlight);

        // Color depth simulation
        float depth = (vWorldPosition.y + 1.0) * 0.5; // Normalize to 0-1 range
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        // Enhance transparency effect with reduced environment map influence
        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}
async function playfulMaterial(textureLoader, environment, honeyType, jarSize, honeyMeshes){
  console.log(" JARSIZE =======> ", jarSize)
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  const boundingBox300 = boundingBoxes['300g'].boundingBox
  const boundingBox450 = boundingBoxes['450g'].boundingBox
  const uJarMinY300 = boundingBox300.min.y
  const uJarMaxY300 = boundingBox300.max.y
  const height300 = uJarMaxY300 - uJarMinY300;
  const uJarMinY450 = boundingBox450.min.y
  const uJarMaxY450 = boundingBox450.max.y
  const height450 = uJarMaxY450 - uJarMinY450;
  console.log(" HEEEEEEEEIGHT ", height300, height450)
  console.log(" RAITO:", height300/height450)
  let scaleFactor = height300/height450

  if(jarSize === '300g') scaleFactor = 1.0;
  console.log("3. CALCULATING OLD MATCAP")
  let honeyParameters = honeyPresets[honeyType]
  
  const honeyColor = new Color(honeyParameters.colorCode)
  
  console.log("ID OF TEX:", honeyParameters.matcapId)
  // Load matcap texture
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);
  console.log("Applying matcap TEXTURE:", matcapTexture)
  let worldPosition = new Vector3(0.15000002, -0.1, 0.0)
  return new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor},
      time: { value: 0 },
      envMap: { value: environment },
      IOR: { value: honeyParameters.density},
      subSurfaceScatter: { value: honeyParameters.light},
      viscosity: { value: honeyParameters.viscosity},
      viscosityWaviness: { value: honeyParameters.viscosityWaviness},
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      idealPosition: { value: worldPosition },
      scaleFactor: { value: scaleFactor },
      dstMinY: { value: uJarMinY300},
      dstMaxY: { value: uJarMaxY300},
      srcMinY: { value: uJarMinY300},
      srcMaxY: { value: uJarMaxY450},
    },
    vertexShader: `
      uniform float srcMinY;  // boundingBox.min.y for the jar you are rendering
      uniform float srcMaxY;  // boundingBox.max.y for the jar you are rendering
      uniform float dstMinY;  // boundingBox.min.y for the medium jar (the 'good' look)
      uniform float dstMaxY;  // boundingBox.max.y for the medium jar

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
          // Normal + View position as usual
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;

          // 1) Compute the jar's actual world position
          vec3 rawWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

          // 2) Convert Y from the jar's bounding‐box range to [0..1]
          float normalizedY = (rawWorldPosition.y - srcMinY) / (srcMaxY - srcMinY);

          // 3) Remap that [0..1] into the medium jar's bounding‐box range
          float remappedY = mix(dstMinY, dstMaxY, normalizedY);

          // 4) Replace just the Y coordinate
          rawWorldPosition.y = remappedY;

          // 5) Pass this on to the fragment shader
          vWorldPosition = rawWorldPosition;

          // Standard projection for actual rendering
          gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform vec3 idealPosition;
      uniform float time;
      uniform samplerCube envMap;
      uniform float envMapIntensity;
      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float highlightIntensity;
      uniform float highlightPosition;
      uniform float viscosityWaviness;


      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = idealPosition + reflectVec * 20.0; // Adjust the 10.0 as needed
        return textureCube(envMap, envMapCoord).rgb;
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Refraction
        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        // Environment reflection with reduced intensity
        vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

        // Adjusted Fresnel effect
        float fresnelPower = 3.0;
        float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

        // Subsurface scattering approximation
        vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

        // Viscosity simulation (subtle movement)
        float viscosityEffect = sin(vWorldPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // Enhanced Vertical highlight
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vWorldPosition.y));
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        // Blend colors with adjusted weights
        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;

        // Apply vertical highlight more prominently
        finalColor += vec3(verticalHighlight);

        // Color depth simulation
        float depth = (vWorldPosition.y + 1.0) * 0.5; // Normalize to 0-1 range
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        // Enhance transparency effect with reduced environment map influence
        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}

async function playfulMaterial2(textureLoader, environment, honeyType, jarSize){
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  const boundingBox300 = boundingBoxes['300g'].boundingBox
  const boundingBox450 = boundingBoxes['450g'].boundingBox
  const uJarMinY300 = boundingBox300.min.y
  const uJarMaxY300 = boundingBox300.max.y
  const height300 = uJarMaxY300 - uJarMinY300;
  const uJarMinY450 = boundingBox450.min.y
  const uJarMaxY450 = boundingBox450.max.y
  const height450 = uJarMaxY450 - uJarMinY450;
  let meshHeight = jarSize === '300g' ? height300 : height450

  let honeyParameters = honeyPresets[honeyType]
  const honeyColor = new Color(honeyParameters.colorCode)
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);
  let worldPosition = new Vector3(0.15000002, -0.1, 0.0)
  
  return new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor},
      time: { value: 0 },
      envMap: { value: environment },
      IOR: { value: honeyParameters.density},
      subSurfaceScatter: { value: honeyParameters.light},
      viscosity: { value: honeyParameters.viscosity},
      viscosityWaviness: { value: honeyParameters.viscosityWaviness},
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      idealPosition: { value: worldPosition },
      mediumJarHeight: { value: height300 },  // Reference height of medium jar
      currentJarHeight: { value: meshHeight }   // Height of current jar
    },
    vertexShader: `
      uniform float mediumJarHeight;
      uniform float currentJarHeight;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vScaledPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        // Scale the world position to match medium jar's scale
        float scaleFactor = mediumJarHeight / currentJarHeight;
        vScaledPosition = vWorldPosition * scaleFactor;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform vec3 idealPosition;
      uniform float time;
      uniform samplerCube envMap;
      uniform float envMapIntensity;
      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float highlightIntensity;
      uniform float highlightPosition;
      uniform float viscosityWaviness;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vScaledPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = idealPosition + reflectVec * 20.0;
        return textureCube(envMap, envMapCoord).rgb;
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

        float fresnelPower = 3.0;
        float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

        vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

        // Use scaled position for viscosity
        float viscosityEffect = sin(vScaledPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // Use scaled position for highlight
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vScaledPosition.y));
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;
        finalColor += vec3(verticalHighlight);

        // Use scaled position for color depth
        float depth = (vScaledPosition.y + 1.0) * 0.5;
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}
async function deepseekHoneyMaterial(textureLoader, environment, honeyType, jarSize, honeyMeshes){
  
  // const meshStore = useMeshStore();
  // const boundingBoxes = toRaw(meshStore.boundingBoxes);
  // const boundingBox = boundingBoxes[currentJarSize].boundingBox
  // const uJarMinY = boundingBox.min.y
  // const uJarMaxY = boundingBox.max.y
  // const height = uJarMaxY - uJarMinY;

  console.log("Honey meshes:", honeyMeshes)
  // let honeyMesh = honeyMeshes[jarSize]
  // let meshGeometry = honeyMesh.geometry 
  
  // const count = meshGeometry.attributes.position.count;
  // const heights = new Float32Array(count).fill(height);
  
  // meshGeometry.setAttribute('jarHeight', new BufferAttribute(heights, 1));
  const honeyParameters = honeyPresets[honeyType];
  const honeyColor = new Color(honeyParameters.colorCode);
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);

  // Size-dependent parameters
  const sizeParams = {
    '150g': { heightScale: 0.7, viscosityScale: 1.3 },
    '300g': { heightScale: 1.0, viscosityScale: 1.0 },
    '450g': { heightScale: 1.5, viscosityScale: 0.7 }
  }[jarSize];
  
  // meshGeometry.setAttribute('heightScale', new BufferAttribute(heights, 1));
  console.log("Size Params:", sizeParams)
  return new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor },
      time: { value: 0 },
      envMap: { value: environment },
      IOR: { value: honeyParameters.density },
      subSurfaceScatter: { value: honeyParameters.light },
      viscosity: { value: honeyParameters.viscosity },
      viscosityWaviness: { value: honeyParameters.viscosityWaviness * sizeParams.viscosityScale },
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0 },
      idealPosition: { value: new Vector3(0.15, -0.1, 0.0) },
      heightScale: { value: sizeParams.heightScale }
    },
    vertexShader: `
      uniform float heightScale;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying float vScaledHeight;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vScaledHeight = position.y / heightScale;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform float time;
      uniform samplerCube envMap;
      uniform float envMapIntensity;
      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float viscosityWaviness;
      uniform float highlightIntensity;
      uniform float highlightPosition;
      uniform float heightScale;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying float vScaledHeight;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        return textureCube(envMap, reflectVec).rgb * envMapIntensity;
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Size-normalized refraction
        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        // Size-corrected viscosity effect
        float viscosityEffect = sin(vScaledHeight * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect * 0.3);

        // Environment reflections
        vec3 reflColor = getEnvironmentReflection(viewDir, normal);
        
        // Height-normalized effects
        float verticalHighlight = smoothstep(highlightPosition - 0.1, 
          highlightPosition + 0.1, abs(vScaledHeight)) * highlightIntensity;
        
        float depth = mix(0.5, 1.0, smoothstep(-1.0, 1.0, vScaledHeight));
        vec3 depthColor = colorAdjust * depth;

        // Final composition
        vec3 finalColor = mix(matcapColor, depthColor, 0.7);
        finalColor = mix(finalColor, reflColor, 0.2);
        finalColor += verticalHighlight * vec3(1.0, 0.9, 0.8);

        // Alpha handling for different sizes
        float alpha = mix(0.9, 0.95, smoothstep(0.3, 0.7, abs(vScaledHeight)));
        alpha *= mix(0.95, 1.0, heightScale); // Adjust transparency based on size

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    opacity: 0.9
  });
}

import { toRaw } from 'vue';
import { useMeshStore } from '../../store/meshes';
import { storeToRefs } from 'pinia';
async function oldHoneyMaterialNormalized(textureLoader, environment, honeyType, currentJarSize){
  console.log("3. CALCULATING OLD MATCAP")
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  const boundingBox = boundingBoxes[currentJarSize].boundingBox
  const uJarMinY = boundingBox.min.y
  const uJarMaxY = boundingBox.max.y
  const height = uJarMaxY - uJarMinY;
  console.log(" HEEEEEEEEIGHT ", height)

  let honeyParameters = honeyPresets[honeyType]
  const honeyColor = new Color(honeyParameters.colorCode)

  // Load matcap texture
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);

  
  let worldPosition = new Vector3(0.15000002, -0.1, 0.0) // remnant of the old times... it's power is unknown to us
  return new ShaderMaterial({
    uniforms: {
      // jarMin: { value: boundingBoxes[currentJarSize].referenceBounds.min },
      // jarSize: { value: boundingBoxes[currentJarSize].referenceBounds.size },
      // refMin: { value: boundingBoxes['300g'].referenceBounds.min },
      // refSize: { value: boundingBoxes['300g'].referenceBounds.size },
      // pivotOffset: { value: center},
      // uJarHeight: { value: height },
      uJarMinY: { value: uJarMinY },
      uJarHeight: { value: height },

      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor},
      time: { value: 0 },
      envMap: { value: environment },
      IOR: { value: honeyParameters.density},
      subSurfaceScatter: { value: honeyParameters.light},
      viscosity: { value: honeyParameters.viscosity},
      viscosityWaviness: { value: honeyParameters.viscosityWaviness},
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      idealPosition: { value: worldPosition }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vLocalPosition;
      
      void main() {
        vLocalPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform vec3 idealPosition;
      uniform float time;
      uniform samplerCube envMap;
      uniform float envMapIntensity;
      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float highlightIntensity;
      uniform float highlightPosition;
      uniform float viscosityWaviness;
      uniform float uJarHeight;
      uniform float uJarMinY; // Added min Y

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vLocalPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = idealPosition + reflectVec * 20.0;
        return textureCube(envMap, envMapCoord).rgb;
      }

      void main() {
        // PROPER NORMALIZATION - fixes positioning issues
        float normalizedY = (vLocalPosition.y - uJarMinY) / uJarHeight;

        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Refraction (keep original calculation)
        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        // Environment reflection (original version)
        vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

        // Fresnel effect (keep original power)
        float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);

        // Subsurface scattering (original formula)
        vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

        // Viscosity effect (adjusted calculation)
        float viscosityEffect = sin(normalizedY * viscosityWaviness * 5.0 + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect * 0.5); // Reduced intensity

        // Vertical highlight (original behavior)
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, normalizedY);
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity;

        // Color mixing (original ratios)
        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;
        finalColor += vec3(verticalHighlight);

        // Depth calculation (original concept)
        float depth = smoothstep(0.2, 0.8, normalizedY);
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        // Transparency effect (original parameters)
        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}

export { 
  honeyMaterialPositionInput,
  honeyMaterial,
  oldHoneyMaterial,
  oldHoneyMaterialNormalized,
  deepseekHoneyMaterial,
  playfulMaterial,
  playfulMaterial2
}