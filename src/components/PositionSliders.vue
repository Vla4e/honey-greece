<template>
  <div class="mesh-slider-control">
    <div class="sliders">
      <h3 style="color:black;">Control Jar Medium</h3>
      <label for="xSliderMedium">X Position: {{ xMedium }}</label>
      <input type="range" id="xSliderMedium" min="-0.5" max="0.2" step="0.00001" v-model="xMedium" @input="updatePosition('x', xMedium, jarMedium)">

      <label for="ySliderMedium">Y Position: {{ yMedium }}</label>
      <input type="range" id="ySliderMedium" min="-0.2" max="0.2" step="0.00001" v-model="yMedium" @input="updatePosition('y', yMedium, jarMedium)">

      <label for="zSliderMedium">Z Position: {{ zMedium }}</label>
      <input type="range" id="zSliderMedium" min="-0.2" max="0.2" step="0.00001" v-model="zMedium" @input="updatePosition('z', zMedium, jarMedium)">

      <h3 style="color:black;">Control Jar Small</h3>
      <label for="xSliderSmall">X Position: {{ xSmall }}</label>
      <input type="range" id="xSliderSmall" min="-1" max="0.1" step="0.00001" v-model="xSmall" @input="updatePosition('x', xSmall, jarSmall)">

      <label for="ySliderSmall">Y Position: {{ ySmall }}</label>
      <input type="range" id="ySliderSmall" min="-0.2" max="0.2" step="0.00001" v-model="ySmall" @input="updatePosition('y', ySmall, jarSmall)">

      <label for="zSliderSmall">Z Position: {{ zSmall }}</label>
      <input type="range" id="zSliderSmall" min="-0.2" max="0.2" step="0.00001" v-model="zSmall" @input="updatePosition('z', zSmall, jarSmall)">
    </div>
  </div>
</template>

<script>
import { ref, watch, watchEffect, onMounted, onUnmounted, toRaw, computed, inject } from 'vue';

export default {
  name: 'PositionSliders',
  props: {
    jarMedium: Array, // Expecting an array of THREE.Mesh objects for medium jar
    jarSmall: Array   // Expecting an array of THREE.Mesh objects for small jar
  },
  setup(props) {
    let emitter = inject('emitter')
    const xMedium = ref(0);
    const yMedium = ref(0);
    const zMedium = ref(0);
    const xSmall = ref(0);
    const ySmall = ref(0);
    const zSmall = ref(0);
    const initialized = ref(false);

    const initialSmall = ref([]);
    const initialMedium = ref([]);

    const updatePosition = (axis, value, meshArray) => {
      if (meshArray && meshArray.length) {
        meshArray.forEach(mesh => {
          mesh.position[axis] = parseFloat(value);
        });
      }
    };

    // Compute the average initial position for medium jar
    const averageMediumPosition = computed(() => {
      if (initialMedium.value.length === 0) return { x: 0, y: 0, z: 0 };
      const sum = initialMedium.value.reduce(
        (acc, pos) => {
          acc.x += pos.x;
          acc.y += pos.y;
          acc.z += pos.z;
          return acc;
        },
        { x: 0, y: 0, z: 0 }
      );
      return {
        x: sum.x / initialMedium.value.length,
        y: sum.y / initialMedium.value.length,
        z: sum.z / initialMedium.value.length
      };
    });

    // Compute the average initial position for small jar
    const averageSmallPosition = computed(() => {
      if (initialSmall.value.length === 0) return { x: 0, y: 0, z: 0 };
      const sum = initialSmall.value.reduce(
        (acc, pos) => {
          acc.x += pos.x;
          acc.y += pos.y;
          acc.z += pos.z;
          return acc;
        },
        { x: 0, y: 0, z: 0 }
      );
      return {
        x: sum.x / initialSmall.value.length,
        y: sum.y / initialSmall.value.length,
        z: sum.z / initialSmall.value.length
      };
    });

    // Watch for changes in initial positions and update the sliders accordingly
    watch(averageMediumPosition, (newPos) => {
      xMedium.value = newPos.x;
      yMedium.value = newPos.y;
      zMedium.value = newPos.z;
    });

    watch(averageSmallPosition, (newPos) => {
      xSmall.value = newPos.x;
      ySmall.value = newPos.y;
      zSmall.value = newPos.z;
    });
    // watch([() => props.jarMedium, () => props.jarSmall], ([newMedium, newSmall]) => {
    //   console.log("PROPS WATCH", props.jarMedium, props.jarSmall)
    //   if (newMedium.length > 0 && newSmall.length > 0 && !initialized.value) {
    //     initialized.value = true;
    //     onPropsPassed(); // Function to trigger when props are passed
    //   }
    // }, { immediate: true });

    watchEffect(() => {
      if (props.jarMedium.length > 0 && props.jarSmall.length > 0 && !initialized.value) {
        initialized.value = true;
        onPropsPassed(); // Function to trigger when props are passed
      }
    });

    function onPropsPassed(){
      initialMedium.value = []
      initialSmall.value = []
      console.log("CALLED ON PROPS PASSED")
      props.jarMedium.forEach(mesh => {
          initialMedium.value.push({
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z
          });
        });

        props.jarSmall.forEach(mesh => {
          initialSmall.value.push({
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z
          });
        });

        console.log("Initial Medium Positions:", toRaw(initialMedium.value));
        console.log("Initial Small Positions:", toRaw(initialSmall.value));
    }
    onMounted(() => { // Assuming 2 seconds is enough for the initial scene setup
      emitter.on('getPositions', onPropsPassed)
    });

    onUnmounted(() => {
      emitter.off('getPositions')
    })

    watch([xMedium, yMedium, zMedium], ([newX, newY, newZ]) => {
      if (props.jarMedium) {
        props.jarMedium.forEach(mesh => {
          mesh.position.set(newX, newY, newZ);
        });
      }
    });

    watch([xSmall, ySmall, zSmall], ([newX, newY, newZ]) => {
      if (props.jarSmall) {
        props.jarSmall.forEach(mesh => {
          mesh.position.set(newX, newY, newZ);
        });
      }
    });

    return {
      xMedium,
      yMedium,
      zMedium,
      xSmall,
      ySmall,
      zSmall,
      updatePosition
    };
  }
};
</script>

<style scoped>
.mesh-slider-control {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 10px 0px;
  width: 100%;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
h3{
  font-size: 16px;
  margin: 0px !important;
  font-weight: 700;
  border-top: 3px dotted black;
}
label {
  font-weight: normal;
  color: black;
  font-size: 12px;
}

input[type="range"] {
  width: 100%;
}
</style>
