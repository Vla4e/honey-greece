/* Honey Shader Materials */
import {
  Color,
  Vector3,
  ShaderMaterial
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

async function oldHoneyMaterial(textureLoader, environment, honeyType){
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

async function oldHoneyMaterialPositional(textureLoader, environment, honeyType, jarGridPosition = new Vector3(0,0,0)) {
  
  let honeyParameters = honeyPresets[honeyType];
  const honeyColor = new Color(honeyParameters.colorCode);

  // Load matcap texture
  const matcapTexture = await textureLoader.loadAsync(`/assets/matcaps2/${honeyParameters.matcapId}.png`);
  let tempjarGridPosition = new Vector3(0.17224613712402062, 0.2644855822622776, -0.00008241005707532167)
  return new ShaderMaterial({
    uniforms: {
      matcap: { value: matcapTexture },
      colorAdjust: { value: honeyColor },
      time: { value: 0 },
      envMap: { value: environment },

      // Jar‐specific shading parameters
      IOR: { value: honeyParameters.density },
      subSurfaceScatter: { value: honeyParameters.light },
      viscosity: { value: honeyParameters.viscosity },
      viscosityWaviness: { value: honeyParameters.viscosityWaviness },
      highlightPosition: { value: 0.50 },
      highlightIntensity: { value: 0.50 },
      envMapIntensity: { value: 1.0 },

      // The jar’s *actual* grid position
      uGridPosition: { value: tempjarGridPosition }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;

        // The "local" or "world" position inside this scene
        // (But not necessarily the real grid position)
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

      // Key new uniform
      uniform vec3 uGridPosition;

      uniform float IOR;
      uniform float subSurfaceScatter;
      uniform float viscosity;
      uniform float viscosityWaviness;
      uniform float highlightPosition;
      uniform float highlightIntensity;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      // We'll compute environment reflection as if we're physically at uGridPosition
      vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal, vec3 globalPos) {
        vec3 reflectVec = reflect(viewDir, normal);

        // Instead of "idealPosition", offset by the jar's real grid position:
        vec3 envMapCoord = globalPos + reflectVec * 20.0;
        return textureCube(envMap, envMapCoord).rgb;
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // (1) Compute global position in the grid
        //     This is the single biggest change:
        vec3 globalPos = vWorldPosition + uGridPosition;

        // (2) Environment reflection using the real grid position
        vec3 reflColor = getEnvironmentReflection(viewDir, normal, globalPos) * envMapIntensity;

        // (3) Refraction using IOR
        vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
        vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
        vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

        // (4) Adjusted Fresnel
        float fresnelPower = 3.0;
        float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

        // (5) Subsurface scattering approximation
        vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

        // (6) Viscosity simulation
        //     Use globalPos.y so each jar acts as if at the same Y as in the grid
        float viscosityEffect = sin(globalPos.y * viscosityWaviness + time * 0.1) * viscosity;
        matcapColor += vec3(viscosityEffect);

        // (7) Enhanced vertical highlight
        float verticalHighlight = smoothstep(
          highlightPosition - 0.1, 
          highlightPosition + 0.1, 
          abs(globalPos.y)
        );
        verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

        // (8) Blend matcap + reflection + color
        vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
        vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
        finalColor += scatterColor;

        // (9) Apply the vertical highlight more prominently
        finalColor += vec3(verticalHighlight);

        // (10) Color depth simulation
        //      Again use globalPos.y so height in the grid matters
        float depth = (globalPos.y + 1.0) * 0.5;
        finalColor *= mix(vec3(1.0), colorAdjust, depth);

        // (11) Enhance transparency effect with reduced environment map influence
        float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
        finalColor = mix(finalColor, reflColor, transparency * 0.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}

export { honeyMaterialPositionInput, honeyMaterial, oldHoneyMaterial, oldHoneyMaterialPositional}