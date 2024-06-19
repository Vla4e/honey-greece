// PostprocessingSetup.js
import {
    Scene,
    OrthographicCamera,
    ShaderMaterial,
    UniformsUtils,
    WebGLRenderTarget,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    LinearFilter,
    RGBAFormat,
    HalfFloatType,
    Raycaster
  } from 'three';

  import { 
    BokehShader, 
    BokehDepthShader 
  } from 'three/addons/shaders/BokehShader2.js';

  import { debounce } from '@/helpers/globalFunctions.js'

  const raycaster = new Raycaster();
  const effectController = {
    enabled: true,
    jsDepthCalculation: true,
    shaderFocus: false,
    fstop: 5,
    maxblur: 1.0,
    showFocus: false,
    focalDepth: 2.8,
    manualdof: false,
    vignetting: false,
    depthblur: false,
    threshold: 0.5,
    gain: 2.0,
    bias: 0.5,
    fringe: 0.7,
    focalLength: 35,
    noise: true,
    pentagon: false,
    dithering: 0.0001
  }

  export function createMaterialDepthShader(){
    const depthShader = BokehDepthShader;
    let materialDepth = new ShaderMaterial({
      uniforms: depthShader.uniforms,
      vertexShader: depthShader.vertexShader,
      fragmentShader: depthShader.fragmentShader
    });
    return materialDepth
  }

  export function updateMaterialDepthShader(materialDepthShader, camera){
    materialDepthShader.uniforms[ 'mNear' ].value = camera.near;
    materialDepthShader.uniforms[ 'mFar' ].value = camera.far;
  }

  export function initPostprocessing(width, height) {
    const postprocessing = {
      scene: new Scene(),
      camera: new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10000, 10000),
      rtTextureDepth: new WebGLRenderTarget(width, height, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: HalfFloatType
      }),
      rtTextureColor: new WebGLRenderTarget(width, height, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: HalfFloatType
      }),
      materialBokeh: null,
      bokeh_uniforms: null
    };
  
    postprocessing.camera.position.z = 40;
  
    const bokeh_shader = BokehShader;
    postprocessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);
    postprocessing.bokeh_uniforms["tColor"].value = postprocessing.rtTextureColor.texture;
    postprocessing.bokeh_uniforms["tDepth"].value = postprocessing.rtTextureDepth.texture;
    postprocessing.bokeh_uniforms['textureWidth'].value = width;
    postprocessing.bokeh_uniforms['textureHeight'].value = height;
  
    postprocessing.materialBokeh = new ShaderMaterial({
      uniforms: postprocessing.bokeh_uniforms,
      vertexShader: bokeh_shader.vertexShader,
      fragmentShader: bokeh_shader.fragmentShader,
      defines: {
        RINGS: 3,
        SAMPLES: 4
      }
    });
  
    const quad = new Mesh(new PlaneGeometry(width, height), postprocessing.materialBokeh);
    quad.position.z = -500;
    postprocessing.scene.add(quad);
    const backgroundMaterial = new MeshBasicMaterial({ color: 0x0000ff }); // Blue background
    const backgroundQuad = new Mesh(new PlaneGeometry(width, height), backgroundMaterial);
    backgroundQuad.position.z = -1000; // Far behind the post-processing mesh.
    postprocessing.scene.add(backgroundQuad);
    return postprocessing;
  }
  
  export function updateShaderUniforms(postprocessing) {
    let uniforms = postprocessing.bokeh_uniforms;
    for (const key in effectController) {
      if (key in uniforms) {
        if(key === 'focalDepth'){
          console.log("FD not updated")
        } else {
          uniforms[key].value = effectController[key];
        }
      }
    }
  }
  
  export function updateFocusCoords(postprocessing, x, y) {
    postprocessing.bokeh_uniforms['focusCoords'].value.set(x, y);
    // postprocessing.bokeh_uniforms['fstop'] = 0.1;
  }

  export function onPointerMove(event, htmlContainer, postprocessing, windowWidth, windowHeight, mouse) {
    const x = event.clientX / windowWidth.value;
    const y = 1-(event.clientY / windowHeight.value);
    const rect = htmlContainer.getBoundingClientRect();
    let x2 = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    let y2 = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    // console.log("X:", event.clientX, windowWidth.value)
    // console.log("X:", event.clientY, windowHeight.value)
    // console.log("FocusCoords:", x2, y2)
    
    mouse.x = x;
    mouse.y = y;
    // postprocessing.bokeh_uniforms['focusCoords'].value.set(x, y);
    updateFocusCoords(postprocessing, x, y);
  }

  export const debouncePointerMove = debounce(function(event, htmlContainer, postprocessing, windowWidth, windowHeight, mouse) {
    // console.log("got event")
    onPointerMove(event, htmlContainer, postprocessing, windowWidth, windowHeight, mouse)
  }, 0);
  

  export  function calculateDepthOfField(mouse, camera, scene, postprocessing) {
    raycaster.setFromCamera({ x: mouse.x, y: mouse.y }, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const targetDistance = intersects.length > 0 ? intersects[0].distance : 1000;

    // Update only if the change in target distance is significant
    if (Math.abs(mouse.distance - targetDistance) > 10) {
      mouse.distance += (targetDistance - mouse.distance) * 0.03;
      mouse.distance = Math.max(1, Math.min(mouse.distance, 1000)); // example bounds: 1m to 1000m

      const sdistance = smoothstep(camera.near, camera.far, mouse.distance);
      const ldistance = linearize(1 - sdistance, camera);

      mouse.focalDepth = ldistance;
      postprocessing.bokeh_uniforms['focalDepth'].value = mouse.focalDepth;
    }
  }

  export  function smoothstep(near, far, depth) {
    const x = Math.max(0, Math.min(1, (depth - near) / (far - near)));
    return x * x * (3 - 2 * x);
  }

  export  function linearize(depth, camera) {
    const zfar = camera.far;
    const znear = camera.near;
    return -zfar * znear / (depth * (zfar - znear) - zfar);
  }
  export function calculateInitialFocus(target, camera, postprocessing) {
    const targetPosition = new Vector3(); // Set this to the target object's position
    const distance = camera.position.distanceTo(targetPosition);
    
    const sdistance = smoothstep(camera.near, camera.far, distance);
    const ldistance = linearize(1 - sdistance);
    
    postprocessing.bokeh_uniforms['focalDepth'].value = ldistance;
  }
  
  