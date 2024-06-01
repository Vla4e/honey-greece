// PostprocessingSetup.js
import {
    Scene,
    OrthographicCamera,
    ShaderMaterial,
    UniformsUtils,
    WebGLRenderTarget,
    PlaneGeometry,
    Mesh,
    LinearFilter,
    RGBAFormat,
    HalfFloatType
  } from 'three';
  import { BokehShader, BokehDepthShader } from 'three/addons/shaders/BokehShader2.js';
  
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
  
    return postprocessing;
  }
  
  export function updateFocusCoords(postprocessing, x, y) {
    postprocessing.bokeh_uniforms['focusCoords'].value.set(x, y);
  }
  