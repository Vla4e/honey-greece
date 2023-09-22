<template>
  <div class="jar-sc-container" ref="canvasContainer">
    <div class="animation-controls"> 
      <button @click="playAnimation" class="small-button route-button">Play Animation</button>
      <button @click="stopAnimation" class="small-button route-button">Stop Animation</button>
      <button @click="resetAnimation" class="small-button route-button">Reset Animation</button>
    </div>
    <canvas ref="webGl" class="webGl jar-sc-canvas" />
  </div>
</template>
<script>
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { watch, onMounted, ref, computed } from "vue";
import { useWindowSize } from "@vueuse/core";
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import Stats from 'stats.js';
import {
  Scene,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
  HemisphereLight,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  LoopRepeat,
  Clock,
  PointLight,
  AxesHelper,
  AnimationClip,
  AnimationAction,
  PMREMGenerator,
  UnsignedByteType,
  AnimationMixer,
  Box3,
  Vector3,
  // GLTFLoader,
  // DRACOLoader
  // HemisphereLight,
} from "three";
export default {
  setup() {
    
    let stats = new Stats();
    //ref to canvas, window size
    stats.showPanel(1);
    document.body.appendChild(stats.dom)
    console.log('doc body', document.body)
    const webGl = ref();
    const { width, height } = useWindowSize();
    let customWidth = 1000
    let customHeight = 650;
    const aspectRatio = computed(() => {
      return customWidth / customHeight
    });
    
    //Define three variables
    let scene = Scene;
    let camera = PerspectiveCamera;
    let renderer = WebGLRenderer;
    let box = Mesh;
    let controls = OrbitControls;
    let light = HemisphereLight;

    //Animation variables
    let mixer = AnimationMixer;
    let modelReady = false;
    let clock = new Clock();

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderConfig({ type: 'js' });
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    draco.preload();
    loader.setDRACOLoader = ( draco )
    let animationTest;
    function setLighting(renderer){
      console.log('calling set lighting')
      var pmremGenerator = new PMREMGenerator( renderer );
      new RGBELoader()
        .load( 'assets/HDR/test-hdr.hdr', function ( texture ) {
          console.log('loader texture', texture)
          var envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          scene.background = envMap;
          scene.environment = envMap;
          texture.dispose();
          pmremGenerator.dispose();
        })
      pmremGenerator.compileEquirectangularShader();
    }
    const setCanvas = () => {
      scene = new Scene();
      scene.add(new AxesHelper(5))
      // const light1 = new PointLight(0xffffff, 100)
      // light1.position.set(2.5, 2.5, 2.5)
      // scene.add(light1)

      // const light2 = new PointLight(0xffffff, 100)
      // light2.position.set(-2.5, 2.5, 2.5)
      // scene.add(light2)
      // scene.background = new Color('skyblue');

    //// Create Object
      // const geometry = new BoxGeometry(2, 2, 2);
      // const material = new MeshStandardMaterial({
      //   map: new TextureLoader().load("/images/earth2.jpg"),
      // });
      // console.log("GOT MATERIAL", material)
      // box = new Mesh(geometry, material);
      // scene.add(box);
      loader.load('assets/glb/jar-spinToFront.glb', function (gltf) {
        scene.add(gltf.scene)
        gltf.animations; // Array<THREE.AnimationClip>
        console.log("gltf animations", gltf.animations)
        console.log("gltfasset", gltf.scene.children[0])
        mixer = new AnimationMixer(gltf.scene)
        // let animation = mixer.clipAction(gltf.animations[0])
        animationTest = mixer.clipAction(gltf.animations[0])
        console.log("looprepeat", LoopRepeat)
        // animation.setLoop(LoopRepeat);
        // animation.clampWhenFinished = false;
        // animation.enable = true;
        // animation.play()
        // animationTest.setLoop(LoopRepeat);
        animationTest.clampWhenFinished = true;
        // animationTest.enable = true;
        // animationTest.play()
        // const mixer = new AnimationMixer(gltf.scene.children[0]);
        // const clips = gltf.animations;
        // mixer.update(0.2)
        // const clip = AnimationClip.findByName(clips, 'SuzanneAction')
        // console.log("FOUND CLIP", clip)
        // const action = mixer.clipAction(clip);
        // action.play();
        // gltf.scene; // THREE.Group
        //center scene;
        // const box = new Box3().setFromObject( gltf.scene );
        // const center = box.getCenter( new Vector3() );
        // gltf.scene.position.x += ( gltf.scene.position.x - center.x );
        // gltf.scene.position.y += ( gltf.scene.position.y - center.y );
        // gltf.scene.position.z += ( gltf.scene.position.z - center.z );
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object
        modelReady = true;
      })
      //// Lights
      // light = new PointLight(0xffffff, 1);
      // light = new HemisphereLight(0xffff, 0x080820, 1);
      // light.position.set(50, 50, 50);
      // scene.add( light );

      // Camera
      camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;
      camera.position.x = 2;
      camera.position.y = 0.7;
      // camera.position.set(0.8, 1.4, 1.0)
      // scene.add(camera);
      // camera.add(light);

      // Renderer
      const canvas = webGl.value;
      renderer = new WebGLRenderer({ canvas, antialias: true });
      // renderer.setSize(width.value, height.value);
      renderer.setSize(customWidth, customHeight);
      // renderer.render(scene, camera);
      
      setLighting(renderer)

      // Controls
      controls = new OrbitControls(camera, canvas);

      controls.enableDamping = true;
    };

    const updateCamera = () => {
      camera.aspect = aspectRatio.value;
      camera.updateProjectionMatrix();
    };

    const updateRenderer = () => {
      // renderer.setSize(width.value, height.value);
      renderer.setSize(customWidth, customHeight);
      renderer.render(scene, camera);
    };

    watch(aspectRatio, (val) => {
      if (val) {
        updateCamera();
        updateRenderer();
      }
    });

    const animate = () => {
      stats.begin();
      // mesh.rotation.y += 0.01;
      requestAnimationFrame(animate);
      let delta = clock.getDelta()
      if(mixer && modelReady) mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
      stats.end();
    };

    onMounted(() => {
      setCanvas();
      animate();
      console.log('animation:', animation)
    });
    function playAnimation(){
      console.log('clicked')
      animationTest.play()
    }
    function resetAnimation() {
      animationTest.stop()
    }
    function stopAnimation(){
      animationTest.halt()
    }
    return { webGl, playAnimation, stopAnimation, resetAnimation };
  },
}
</script>
<style lang="scss" scoped>
.jar-sc-container{
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 20;
}
.animation-controls{
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  margin-bottom: 30px;
  .small-button{
    margin-right: 10px;
  }
  .small-button:last-child{
    margin-right: 0px;
  }
}
</style>
