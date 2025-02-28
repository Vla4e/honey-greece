import HAAConfig from "../assets/brand-information/HAA.js";
import oktoConfig from "../assets/brand-information/Okto.js";
let brandConfigs = {
  'haa' : HAAConfig,
  'okto': oktoConfig,
}

export async function isHoneyAllowed(brand, productLine, honeyType){
  try{
    console.log("IHA?", brand, productLine, honeyType)
    console.log("brandconfig:", brandConfigs)
    let boolCheck = brandConfigs[brand.toLowerCase()].lineFlavorsArrays[productLine].find((item)=> {
      console.log("item:", item, honeyType)
      return item === honeyType
    })
    // let boolCheck = false
    console.log("BoolCHECK", boolCheck)
    if(boolCheck){
      return true
    } else return false
  } catch (e) {
    console.error("Error while routing:", e)
    return false
  }
}


