import HAAConfig from "../assets/brand-information/HAA.js";
import oktoConfig from "../assets/brand-information/Okto.js";
let brandConfigs = {
  'haa' : HAAConfig,
  'okto': oktoConfig,
}

export async function isHoneyAllowed(brand, productLine, honeyType){
  try{
    let boolCheck = brandConfigs[brand.toLowerCase()].lineFlavorsArrays[productLine].find((item, idx)=> {
      return item === honeyType
    })
    // let boolCheck = false
    if(boolCheck){
      return true
    } else return false
  } catch (e) {
    console.error("Error while routing:", e)
    return false
  }
}


