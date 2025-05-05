/* Honey Shader Materials */
import {
  Color,
  Vector3,
  ShaderMaterial,
  Box3,
  Box3Helper,
  Matrix4,
  Matrix3,
  BufferAttribute
} from 'three';

/*
Below function takes a world position argument from predefined jar positions, 
which in turn affects shader calculations. This was done
due to a jar grid of jars with different matcap textures (IDs: 1 to 46) being used by the client to select
which combination of parameters + position in the world space (HDR calculations are severely affected by this)
is visually most fitting for the honey types they produce.
*/ 
import honeyPresets from '../../assets/honey-visuals/honeyParameterPresets';



async function honeyMaterial(honeyMeshes, textureLoader, envMap, honeyType) {
  try {

    let honeyParameters = honeyPresets[honeyType]

    const honeyColor = new Color(honeyParameters.colorCode)
  
    // Load matcap texture
    const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps/${honeyParameters.matcapId}.png`);

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
  console.log("3. CALCULATING OLD MATCAP", honeyType)
  let honeyParameters = honeyPresets[honeyType]
  
  const honeyColor = new Color(honeyParameters.colorCode)
  
  console.log("ID OF TEX:", honeyParameters.matcapId)
  // Load matcap texture
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps/${honeyParameters.matcapId}.png`);
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
async function playfulMaterial2(textureLoader, environment, honeyType, jarSize, honeyMeshes, brand, camera){
  console.log("Creating pm2, with jarSize", jarSize, brand)
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  console.log("Bounding Boxes:", boundingBoxes)
  
  
  // Mesh of jar we're currently creating shader for
  let currentHoneyMesh = honeyMeshes[jarSize]
  const currentBoundingBox = boundingBoxes[jarSize].boundingBox
  const currentJarMeshPosition = new Vector3(0, 0, 0);
  currentJarMeshPosition.copy(currentHoneyMesh.position);
  currentJarMeshPosition.y += currentBoundingBox.min.y;

  // const boundingBox300 = boundingBoxes['300g'].boundingBox
  // const uJarMinY300 = boundingBox300.min.y
  // const uJarMaxY300 = boundingBox300.max.y
  // const jarCenter300 = uJarMaxY300 - uJarMinY300
  // const height300 = uJarMaxY300 - uJarMinY300;

  // Bounding box calculations for both jars
  let mediumJarBoxSize = '300g';
  let otherJarBoxSize = null;
  if(brand === 'haa'){
    otherJarBoxSize = '150g'
  } else otherJarBoxSize = '450g'
  
  const mediumJarBox = boundingBoxes[mediumJarBoxSize].boundingBox
  const mediumJarBoxProperties = {
    box: mediumJarBox,
    jarMinY: mediumJarBox.min.y,
    jarMaxY: mediumJarBox.max.y,
    jarCenter: mediumJarBox.max.y - mediumJarBox.min.y,
    height: mediumJarBox.max.y - mediumJarBox.min.y
  }
  const otherJarBox = boundingBoxes[otherJarBoxSize].boundingBox
  const otherJarBoxProperties = {
    box: otherJarBox,
    jarMinY: otherJarBox.min.y,
    jarMaxY: otherJarBox.max.y,
    jarCenter: otherJarBox.max.y - otherJarBox.min.y,
    height: otherJarBox.max.y - otherJarBox.min.y
  }
  console.log("Height ratio:", mediumJarBoxProperties.height/otherJarBoxProperties.height)
  // const boundingBox450 = boundingBoxes['450g'].boundingBox
  // const uJarMinY450 = boundingBox450.min.y
  // const uJarMaxY450 = boundingBox450.max.y
  // const jarCenter450 = uJarMaxY450 - uJarMinY450
  // const height450 = uJarMaxY450 - uJarMinY450;

  let jarCenter = jarSize === '300g' ? mediumJarBoxProperties.center : otherJarBoxProperties.center;

  // let meshHeight = jarSize === '300g' ? height300 : height450

  let honeyParameters = honeyPresets[honeyType]
  const honeyColor = new Color(honeyParameters.colorCode)
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps/${honeyParameters.matcapId}.png`);
  let ratio = mediumJarBoxProperties.height/otherJarBoxProperties.height;
  console.log("ACTUAL RATIO:::::::::::::::::: m/o, o/m", ratio, otherJarBoxProperties.height/mediumJarBoxProperties.height)
  const hardCodedMediumJarRatio = 0.9; // looks closest to needed visual
  if(jarSize === '300g') ratio = hardCodedMediumJarRatio

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
      mediumJarHeight: { value: mediumJarBoxProperties.height },    // Reference height of medium jar
      currentJarHeight: { value: otherJarBoxProperties.height },    // Height of current jar
      jarBasePosition: { value: currentJarMeshPosition },  // Base position of the honey mesh
      jarCenter: { value: jarCenter }, // Mesh center,
      jarHeightRatio: {  value: ratio}
    },
    vertexShader: `
      uniform float mediumJarHeight;
      uniform float currentJarHeight;
      uniform float jarHeightRatio;
      uniform vec3 jarBasePosition;
      uniform vec3 jarCenter;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vScaledPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        // Calculate position relative to jar's base
        vec3 relativePosition = vWorldPosition - jarBasePosition;
        
        // Scale the position to match medium jar's scale
        // float scaleFactor = mediumJarHeight / currentJarHeight;
        float scaleFactor = jarHeightRatio;
        
        // Apply scaling while preserving the relative position
        vScaledPosition = relativePosition * scaleFactor + jarBasePosition;
        

        // Flip the matrix ;)

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

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vScaledPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = reflectVec * 20.0;
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
async function playfulMaterial3(textureLoader, environment, honeyType, jarSize, honeyMeshes, brand, camera){
  console.log("Creating pm2, with jarSize", jarSize, brand)
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  console.log("Bounding Boxes:", boundingBoxes)
  
  // Mesh of jar we're currently creating shader for
  let currentHoneyMesh = honeyMeshes[jarSize]
  const currentBoundingBox = boundingBoxes[jarSize].boundingBox
  
  // Store initial position at shader creation time - this is the key to fixing animation issue
  const initialJarPosition = new Vector3()
  initialJarPosition.copy(currentHoneyMesh.position)
  
  // Get the base position (bottom of the jar)
  const currentJarMeshPosition = new Vector3(0, 0, 0);
  currentJarMeshPosition.copy(initialJarPosition);
  currentJarMeshPosition.y += currentBoundingBox.min.y;
  console.log("CJMESHPOS::::::::::", currentJarMeshPosition)

  // Bounding box calculations for both jars
  let mediumJarBoxSize = '300g';
  let otherJarBoxSize = null;
  if(brand === 'haa'){
    otherJarBoxSize = '150g'
  } else otherJarBoxSize = '450g'
  
  const mediumJarBox = boundingBoxes[mediumJarBoxSize].boundingBox
  const mediumJarBoxProperties = {
    box: mediumJarBox,
    jarMinY: mediumJarBox.min.y,
    jarMaxY: mediumJarBox.max.y,
    jarCenter: mediumJarBox.max.y - mediumJarBox.min.y,
    height: mediumJarBox.max.y - mediumJarBox.min.y
  }
  
  const otherJarBox = boundingBoxes[otherJarBoxSize].boundingBox
  const otherJarBoxProperties = {
    box: otherJarBox,
    jarMinY: otherJarBox.min.y,
    jarMaxY: otherJarBox.max.y,
    jarCenter: otherJarBox.max.y - otherJarBox.min.y,
    height: otherJarBox.max.y - otherJarBox.min.y
  }
  
  console.log("Height ratio:", mediumJarBoxProperties.height/otherJarBoxProperties.height)
  
  let jarCenter = jarSize === '300g' ? mediumJarBoxProperties.center : otherJarBoxProperties.center;
  
  let honeyParameters = honeyPresets[honeyType]
  const honeyColor = new Color(honeyParameters.colorCode)
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps/${honeyParameters.matcapId}.png`);
  
  // Calculate the height ratio between medium jar and current jar
  let ratio = mediumJarBoxProperties.height/otherJarBoxProperties.height;
  console.log("ACTUAL RATIO:", ratio, otherJarBoxProperties.height/mediumJarBoxProperties.height)
  
  // Keep the hardcoded value for medium jar to maintain its perfect appearance
  const hardCodedMediumJarRatio = 0.9; // looks closest to needed visual
  if(jarSize === '300g') ratio = hardCodedMediumJarRatio;

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
      highlightPosition: { value: 1.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      mediumJarHeight: { value: mediumJarBoxProperties.height },
      currentJarHeight: { value: jarSize === '300g' ? mediumJarBoxProperties.height : otherJarBoxProperties.height },
      jarBasePosition: { value: currentJarMeshPosition },
      initialJarPosition: { value: initialJarPosition },  // Store initial position to fix animation issues
      jarHeightRatio: { value: ratio },
      jarCenter: { value: jarCenter }
    },
    vertexShader: `
      uniform float mediumJarHeight;
      uniform float currentJarHeight;
      uniform float jarHeightRatio;
      uniform vec3 jarBasePosition;
      uniform vec3 initialJarPosition;
      uniform vec3 jarCenter;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vScaledPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        // Calculate the world position
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        // Calculate position relative to jar's INITIAL position
        // This is the key to fixing the animation issue
        vec3 relativeToInitialPosition = vWorldPosition - initialJarPosition;
        
        // Calculate the current offset from the initial position
        vec3 currentOffset = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz - initialJarPosition;
        
        // Apply the height scaling but preserve the current visual
        // This is why we use the initial position as reference
        vec3 scaledPosition = relativeToInitialPosition;
        scaledPosition.y *= jarHeightRatio;
        
        // Add back the current offset to get the final position
        // This ensures the shader doesn't change during animations
        vScaledPosition = scaledPosition + initialJarPosition;

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

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vScaledPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = reflectVec * 20.0;
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

        // Use scaled position for viscosity - Preserves current visual but applies scaling
        float viscosityEffect = sin(vScaledPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // Use scaled position for highlight
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vWorldPosition.y));
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
async function playfulMaterial4(textureLoader, environment, honeyType, jarSize, honeyMeshes, brand, camera){
  console.log("Creating pm2, with jarSize", jarSize, brand)
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  
  // Mesh of jar we're currently creating shader for
  let currentHoneyMesh = honeyMeshes[jarSize]
  const currentBoundingBox = boundingBoxes[jarSize].boundingBox
  
  // Store initial position at shader creation time
  const initialJarPosition = new Vector3()
  initialJarPosition.copy(currentHoneyMesh.position)
  
  // Get the base position (bottom of the jar)
  const currentJarMeshPosition = new Vector3(0, 0, 0);
  currentJarMeshPosition.copy(initialJarPosition);
  currentJarMeshPosition.y += currentBoundingBox.min.y;

  // Bounding box calculations for both jars
  let mediumJarBoxSize = '300g';
  let otherJarBoxSize = null;
  if(brand === 'haa'){
    otherJarBoxSize = '150g'
  } else otherJarBoxSize = '450g'
  
  const mediumJarBox = boundingBoxes[mediumJarBoxSize].boundingBox
  const mediumJarBoxProperties = {
    box: mediumJarBox,
    jarMinY: mediumJarBox.min.y,
    jarMaxY: mediumJarBox.max.y,
    jarCenter: (mediumJarBox.max.y + mediumJarBox.min.y) / 2,
    height: mediumJarBox.max.y - mediumJarBox.min.y
  }
  
  const otherJarBox = boundingBoxes[otherJarBoxSize].boundingBox
  const otherJarBoxProperties = {
    box: otherJarBox,
    jarMinY: otherJarBox.min.y,
    jarMaxY: otherJarBox.max.y,
    jarCenter: (otherJarBox.max.y + otherJarBox.min.y) / 2,
    height: otherJarBox.max.y - otherJarBox.min.y
  }
  
  // Get current jar properties
  const currentJarProperties = jarSize === '300g' ? mediumJarBoxProperties : otherJarBoxProperties;
  
  let honeyParameters = honeyPresets[honeyType]
  const honeyColor = new Color(honeyParameters.colorCode)
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps/${honeyParameters.matcapId}.png`);
  
  // The medium jar's visual properties we want to preserve
  const mediumJarVisualCenter = mediumJarBoxProperties.jarCenter;
  const mediumJarVisualHeight = mediumJarBoxProperties.height;
  const hardCodedMediumJarRatio = 0.9; // The perfect ratio for medium jar
  
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
      highlightPosition: { value: 1.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      mediumJarMinY: { value: mediumJarBoxProperties.jarMinY },
      mediumJarMaxY: { value: mediumJarBoxProperties.jarMaxY },
      mediumJarHeight: { value: mediumJarBoxProperties.height },
      mediumJarCenter: { value: mediumJarBoxProperties.jarCenter },
      currentJarMinY: { value: currentJarProperties.jarMinY },
      currentJarMaxY: { value: currentJarProperties.jarMaxY },
      currentJarHeight: { value: currentJarProperties.height },
      currentJarCenter: { value: currentJarProperties.jarCenter },
      jarBasePosition: { value: currentJarMeshPosition },
      initialJarPosition: { value: initialJarPosition },
      hardCodedRatio: { value: hardCodedMediumJarRatio },
      isMediumJar: { value: jarSize === '300g' ? 1.0 : 0.0 }
    },
    vertexShader: `
      uniform float mediumJarMinY;
      uniform float mediumJarMaxY;
      uniform float mediumJarHeight;
      uniform float mediumJarCenter;
      uniform float currentJarMinY;
      uniform float currentJarMaxY;
      uniform float currentJarHeight;
      uniform float currentJarCenter;
      uniform vec3 jarBasePosition;
      uniform vec3 initialJarPosition;
      uniform float hardCodedRatio;
      uniform float isMediumJar;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vNormalizedPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        // Calculate the world position
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        // Store the actual world position for visual calculations
        vec3 actualWorldPos = vWorldPosition;
        
        // Calculate the current mesh position in world space
        vec3 currentMeshWorldPos = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        
        // For medium jar, apply the hardcoded ratio that gives the perfect look
        if (isMediumJar > 0.5) {
          // For medium jar, just use the actual positions with the hardcoded ratio
          // that already gives the perfect look
          vec3 relativePos = actualWorldPos - currentMeshWorldPos;
          float normalizedY = (relativePos.y / currentJarHeight);
          vNormalizedPosition = relativePos;
          vNormalizedPosition.y = normalizedY * hardCodedRatio * mediumJarHeight;
          vNormalizedPosition += currentMeshWorldPos;
        } else {
          // For other jars, we need to normalize the position relative to the medium jar
          // 1. Get position relative to current jar's world position
          vec3 relativePos = actualWorldPos - currentMeshWorldPos;
          
          // 2. Normalize the Y position to 0-1 range within current jar's bounds
          float normalizedY = (relativePos.y / currentJarHeight);
          
          // 3. Map this normalized position to equivalent position in medium jar
          // using the hardcoded ratio that gave the perfect look
          vNormalizedPosition = relativePos;
          vNormalizedPosition.y = normalizedY * hardCodedRatio * mediumJarHeight;
          
          // 4. Add back the current jar's world position
          vNormalizedPosition += currentMeshWorldPos;
        }

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

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vNormalizedPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = reflectVec * 20.0;
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

        // Use normalized position for all visual effects
        float viscosityEffect = sin(vNormalizedPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // Use normalized position for highlight
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vNormalizedPosition.y));
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;
        finalColor += vec3(verticalHighlight);

        // Use normalized position for color depth
        float depth = (vNormalizedPosition.y + 1.0) * 0.5;
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}
async function playfulMaterial5(textureLoader, environment, honeyType, jarSize, honeyMeshes, brand, camera, scene){
  console.log("Creating pm2, with jarSize", jarSize, brand)
  const meshStore = useMeshStore();
  const boundingBoxes = toRaw(meshStore.boundingBoxes);
  
  // Mesh of jar we're currently creating shader for
  let currentHoneyMesh = honeyMeshes[jarSize]
  const currentBoundingBox = boundingBoxes[jarSize].boundingBox
  
  const box = new Box3().setFromObject(currentHoneyMesh);
  const boxHelper = new Box3Helper(box, '#FF0000');
  // scene.add(boxHelper)
  // Store initial position at shader creation time
  const initialJarPosition = new Vector3()
  initialJarPosition.copy(currentHoneyMesh.position)
  
  // Get the base position (bottom of the jar)
  const currentJarMeshPosition = new Vector3(0, 0, 0);
  currentJarMeshPosition.copy(initialJarPosition);
  currentJarMeshPosition.y += currentBoundingBox.min.y;

  // Bounding box calculations for both jars
  let mediumJarBoxSize = '300g';
  let otherJarBoxSize = null;
  if(brand === 'haa'){
    otherJarBoxSize = '150g'
  } else otherJarBoxSize = '450g'
  
  const mediumJarBox = boundingBoxes[mediumJarBoxSize].boundingBox
  const mediumJarBoxProperties = {
    box: mediumJarBox,
    jarMinY: mediumJarBox.min.y,
    jarMaxY: mediumJarBox.max.y,
    jarCenter: (mediumJarBox.max.y + mediumJarBox.min.y) / 2,
    height: mediumJarBox.max.y - mediumJarBox.min.y
  }
  
  const otherJarBox = boundingBoxes[otherJarBoxSize].boundingBox
  const otherJarBoxProperties = {
    box: otherJarBox,
    jarMinY: otherJarBox.min.y,
    jarMaxY: otherJarBox.max.y,
    jarCenter: (otherJarBox.max.y + otherJarBox.min.y) / 2,
    height: otherJarBox.max.y - otherJarBox.min.y
  }
  
  // Get current jar properties
  const currentJarProperties = jarSize === '300g' ? mediumJarBoxProperties : otherJarBoxProperties;
  
  let honeyParameters = honeyPresets[honeyType]
  const honeyColor = new Color(honeyParameters.colorCode)
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps/${honeyParameters.matcapId}.png`);
  
  // The medium jar's visual properties we want to preserve
  const mediumJarVisualCenter = mediumJarBoxProperties.jarCenter;
  const mediumJarVisualHeight = mediumJarBoxProperties.height;
  const hardCodedMediumJarRatio = 0.9; // The perfect ratio for medium jar
  let saturationValue = jarSize === '300g' ? 1.0 : honeyParameters.saturation;
  let brightnessValue = jarSize === '300g' ? 1.0 : honeyParameters.brightness;
  let shaderMaterial = new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor},
      time: { value: 0 },
      brightness: { value: brightnessValue},
      saturation: { value: saturationValue},
      envMap: { value: environment },
      IOR: { value: honeyParameters.density},
      subSurfaceScatter: { value: honeyParameters.light},
      viscosity: { value: honeyParameters.viscosity},
      viscosityWaviness: { value: honeyParameters.viscosityWaviness},
      highlightPosition: { value: 1.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0},
      mediumJarMinY: { value: mediumJarBoxProperties.jarMinY },
      mediumJarMaxY: { value: mediumJarBoxProperties.jarMaxY },
      mediumJarHeight: { value: mediumJarBoxProperties.height },
      mediumJarCenter: { value: mediumJarBoxProperties.jarCenter },
      currentJarMinY: { value: currentJarProperties.jarMinY },
      currentJarMaxY: { value: currentJarProperties.jarMaxY },
      currentJarHeight: { value: currentJarProperties.height },
      currentJarCenter: { value: currentJarProperties.jarCenter },
      jarBasePosition: { value: currentJarMeshPosition },
      initialJarPosition: { value: initialJarPosition },
      hardCodedRatio: { value: hardCodedMediumJarRatio },
      isMediumJar: { value: jarSize === '300g' ? 1.0 : 0.0 }
    },
    vertexShader: `
      uniform float mediumJarMinY;
      uniform float mediumJarMaxY;
      uniform float mediumJarHeight;
      uniform float mediumJarCenter;
      uniform float currentJarMinY;
      uniform float currentJarMaxY;
      uniform float currentJarHeight;
      uniform float currentJarCenter;
      uniform vec3 jarBasePosition;
      uniform vec3 initialJarPosition;
      uniform float hardCodedRatio;
      uniform float isMediumJar;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vNormalizedPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        // Calculate the world position
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        // Store the actual world position for visual calculations
        vec3 actualWorldPos = vWorldPosition;
        
        // Calculate the current mesh position in world space
        vec3 currentMeshWorldPos = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        
        // For medium jar, apply the hardcoded ratio that gives the perfect look
        if (isMediumJar > 0.5) {
          // For medium jar, just use the actual positions with the hardcoded ratio
          // that already gives the perfect look
          vec3 relativePos = actualWorldPos - currentMeshWorldPos;
          float normalizedY = (relativePos.y / currentJarHeight);
          vNormalizedPosition = relativePos;
          vNormalizedPosition.y = normalizedY * hardCodedRatio * mediumJarHeight;
          vNormalizedPosition += currentMeshWorldPos;
        } else {
          // For other jars, we need to normalize the position relative to the medium jar
          // 1. Get position relative to current jar's world position
          vec3 relativePos = actualWorldPos - currentMeshWorldPos;
          
          // 2. Normalize the Y position to 0-1 range within current jar's bounds
          float normalizedY = (relativePos.y / currentJarHeight);
          
          // 3. Map this normalized position to equivalent position in medium jar
          // using the hardcoded ratio that gave the perfect look
          vNormalizedPosition = relativePos;
          vNormalizedPosition.y = normalizedY * hardCodedRatio * mediumJarHeight;
          
          // 4. Add back the current jar's world position
          vNormalizedPosition += currentMeshWorldPos;
        }

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D matcap;
      uniform vec3 colorAdjust;
      uniform float time;
      uniform float brightness;
      uniform float saturation;
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
      varying vec3 vNormalizedPosition;

      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
        vec3 reflectVec = reflect(viewDir, normal);
        vec3 envMapCoord = reflectVec * 20.0;
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

        // Use normalized position for all visual effects
        float viscosityEffect = sin(vNormalizedPosition.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // Use normalized position for highlight
        float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vNormalizedPosition.y));
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;
        finalColor += vec3(verticalHighlight);

        // Use normalized position for color depth
        float depth = (vNormalizedPosition.y + 1.0) * 0.5;
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        vec3 grayscale = vec3(luminance);
        finalColor = mix(grayscale, finalColor, 1.00);
        finalColor *= 1.00;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
  shaderMaterial.honeyType = honeyType
  shaderMaterial.jarSize = jarSize
  return shaderMaterial
}

import { toRaw } from 'vue';
import { useMeshStore } from '../../store/meshes';
import { storeToRefs } from 'pinia';

export {
  honeyMaterial,
  oldHoneyMaterial,
  playfulMaterial2,
  playfulMaterial3,
  playfulMaterial4,
  playfulMaterial5
}