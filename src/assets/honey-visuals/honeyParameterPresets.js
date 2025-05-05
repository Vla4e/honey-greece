
const honeyPresets = {
  'honey_afficionado': {
    matcapId: 42,
    density: 10.85,
    light: 0.92,
    viscosity: 0.85,
    viscosityWaviness: 20.00,
    colorCode: "#d2800f",
    jarGridPosition: {"x": -0.057753862875979396, "y": -0.0805144177377224, "z": -0.00008241005707532167},
    hardCodedMediumJarRatio: 0.9, // Was manually testing the values inside playfulMaterial2's vertex shader, and 0.9 seemed to replicate the same visual as chosen by client
    brightness: 1.161,
    saturation: 0.853
  },
  
  'chestnut_honey': {
    matcapId: 20,
    density: 10.44,
    light: 0.67,
    viscosity: 1.71,
    viscosityWaviness: 32.00,
    colorCode: "#fbac23",
    jarGridPosition: {"x": 0.17224613712402062, "y": 0.1494855822622776, "z": -0.00008241005707532167},
    brightness: 0.791,
    saturation: 0.921
  },
  
  'cotton_honey': {
    matcapId: 20,
    density: 10.44,
    light: 0.89,
    viscosity: 1.71,
    viscosityWaviness: 30.00,
    colorCode: "#fbac23",
    jarGridPosition: {"x": 0.17224613712402062, "y": 0.1494855822622776, "z": -0.00008241005707532167},
    brightness: 0.928,
    saturation: 0.853
  },
  
  'fir_honey': {
    matcapId: 7,
    density: 10.85,
    light: 0.92,
    viscosity: 0.85,
    viscosityWaviness: 20.00,
    colorCode: "#a57531",
    jarGridPosition: {"x": 0.05724613712402061, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 1.099,
    saturation: 1.044
  },
  
  'forest_blend': {
    matcapId: 8,
    density: 9.57,
    light: 1.24,
    viscosity: 2.25,
    viscosityWaviness: 20.00,
    colorCode: "#c38822",
    jarGridPosition: {"x": 0.17224613712402062, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 1.126,
    saturation: 0.935
  },
  
  'master_blenders': {
    matcapId: 8,
    density: 9.06,
    light: 0.74,
    viscosity: 0.82,
    viscosityWaviness: 20.00,
    colorCode: "#d2800f",
    jarGridPosition: {"x": 0.17224613712402062, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 0.914,
    saturation: 1.017
  },
  
  'mediterranean_blend': {
    matcapId: 7,
    density: 9.06,
    light: 1.16,
    viscosity: 0.82,
    viscosityWaviness: 20.00,
    colorCode: "#f9a124",
    jarGridPosition: {"x": 0.05724613712402061, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 0.785,
    saturation: 0.86
  },

  'natures_blend': {
    matcapId: 11,
    density: 9.06,
    light: 0.7,
    viscosity: 0.82,
    viscosityWaviness: 20.00,
    colorCode: "#c17719",
    jarGridPosition: {"x": 0.5172461371240207, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 1.181,
    saturation: 0.819
  },
  
  'oak_honey': {
    matcapId: 12,
    density: 10.85,
    light: 0.46,
    viscosity: 0.85,
    viscosityWaviness: 17.00,
    colorCode: "#493518",
    jarGridPosition: {"x": 0.6322461371240207, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 1.612,
    saturation: 1.817
  },
  
  'pine_honey': {
    matcapId: 12,
    density: 9.68,
    light: 0.32,
    viscosity: 0.85,
    viscosityWaviness: 17.00,
    colorCode: "#fbac23",
    jarGridPosition: {"x": 0.6322461371240207, "y": 0.2644855822622776, "z": -0.00008241005707532167},
    brightness: 1.106,
    saturation: 0.764
  },

  'thyme_honey': {
    matcapId: 43,
    density: 9.06,
    light: 0.99,
    viscosity: 0.82,
    viscosityWaviness: 20.00,
    colorCode: "#f2c445",
    jarGridPosition: {"x": 0.05724613712402061, "y": -0.0805144177377224, "z": -0.00008241005707532167},
    brightness: 0.921,
    saturation: 0.740
  },
}


export default honeyPresets

// const honeyPresets = {
//   'afficionado': {
//     matcapId: 42,
//     density: 10.85,
//     light: 0.92,
//     viscosity: 0.85,
//     viscosityWaviness: 20.00,
//     colorCode: "#d2800f",
//     jarGridPosition: {"x": -0.057753862875979396, "y": -0.0805144177377224, "z": -0.00008241005707532167},
//     hardCodedMediumJarRatio: 0.9, // Was manually testing the values inside playfulMaterial2's vertex shader, and 0.9 seemed to replicate the same visual as chosen by client
//     brightness: 1.161,
//     saturation: 0.853
//   },
  
//   'chestnut': {
//     matcapId: 20,
//     density: 10.44,
//     light: 0.67,
//     viscosity: 1.71,
//     viscosityWaviness: 32.00,
//     colorCode: "#fbac23",
//     jarGridPosition: {"x": 0.17224613712402062, "y": 0.1494855822622776, "z": -0.00008241005707532167},
//     brightness: 0.791,
//     saturation: 0.921
//   },
  
//   'cotton': {
//     matcapId: 20,
//     density: 10.44,
//     light: 0.89,
//     viscosity: 1.71,
//     viscosityWaviness: 30.00,
//     colorCode: "#fbac23",
//     jarGridPosition: {"x": 0.17224613712402062, "y": 0.1494855822622776, "z": -0.00008241005707532167},
//     brightness: 0.928,
//     saturation: 0.853
//   },
  
//   'fir': {
//     matcapId: 7,
//     density: 10.85,
//     light: 0.92,
//     viscosity: 0.85,
//     viscosityWaviness: 20.00,
//     colorCode: "#a57531",
//     jarGridPosition: {"x": 0.05724613712402061, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 1.099,
//     saturation: 1.044
//   },
  
//   'forest': {
//     matcapId: 8,
//     density: 9.57,
//     light: 1.24,
//     viscosity: 2.25,
//     viscosityWaviness: 20.00,
//     colorCode: "#c38822",
//     jarGridPosition: {"x": 0.17224613712402062, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 1.126,
//     saturation: 0.935
//   },
  
//   'master': {
//     matcapId: 8,
//     density: 9.06,
//     light: 0.74,
//     viscosity: 0.82,
//     viscosityWaviness: 20.00,
//     colorCode: "#d2800f",
//     jarGridPosition: {"x": 0.17224613712402062, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 0.914,
//     saturation: 1.017
//   },
  
//   'mediterranean': {
//     matcapId: 7,
//     density: 9.06,
//     light: 1.16,
//     viscosity: 0.82,
//     viscosityWaviness: 20.00,
//     colorCode: "#f9a124",
//     jarGridPosition: {"x": 0.05724613712402061, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 0.785,
//     saturation: 0.86
//   },

//   'natural': {
//     matcapId: 11,
//     density: 9.06,
//     light: 0.7,
//     viscosity: 0.82,
//     viscosityWaviness: 20.00,
//     colorCode: "#c17719",
//     jarGridPosition: {"x": 0.5172461371240207, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 1.181,
//     saturation: 0.819
//   },
  
//   'oak': {
//     matcapId: 12,
//     density: 10.85,
//     light: 0.46,
//     viscosity: 0.85,
//     viscosityWaviness: 17.00,
//     colorCode: "#493518",
//     jarGridPosition: {"x": 0.6322461371240207, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 1.612,
//     saturation: 1.817
//   },
  
//   'pine': {
//     matcapId: 12,
//     density: 9.68,
//     light: 0.32,
//     viscosity: 0.85,
//     viscosityWaviness: 17.00,
//     colorCode: "#fbac23",
//     jarGridPosition: {"x": 0.6322461371240207, "y": 0.2644855822622776, "z": -0.00008241005707532167},
//     brightness: 1.106,
//     saturation: 0.764
//   },

//   'thyme': {
//     matcapId: 43,
//     density: 9.06,
//     light: 0.99,
//     viscosity: 0.82,
//     viscosityWaviness: 20.00,
//     colorCode: "#f2c445",
//     jarGridPosition: {"x": 0.05724613712402061, "y": -0.0805144177377224, "z": -0.00008241005707532167},
//     brightness: 0.921,
//     saturation: 0.740
//   },
// }

// export default honeyPresets