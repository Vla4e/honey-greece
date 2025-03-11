import router from '@/router';

let temp = 0;

//Was used to calculate animation path for jars.
export function parabolicPathCoordinate(pathCoord, startCoord, endCoord){
  //  // Calculate the midpoint of startCoord and endCoord
  //  const midPoint = (startCoord + endCoord) / 2;
  //  // Calculate the maximum pathCoord offset at the midpoint
  //  const maxOffset = Math.abs(endCoord - startCoord) / 2 * 1.5;
   
  //  // Adjust the scale of the parabola based on the distance between startCoord and endCoord
  //  const scale = 4 / Math.pow(endCoord - startCoord, 2);
   
  //  // Calculate the pathCoord position based on a parabolic formula
  //  let res = maxOffset - scale * Math.pow(pathCoord - midPoint, 2);
  //  if(!temp){
  //   console.log("midpoint", midPoint)
  //   console.log("maxOffset", maxOffset)
  //   console.log("scale", scale)
  //   temp++;
  //  }
  //   // console.log("Result: ", res)
  let res;
  let distance;
  if(endCoord > startCoord){
    distance = Math.abs(endCoord - startCoord)
  } else distance = Math.abs(startCoord - endCoord)
  // let distance = Math.abs(Math.abs(startCoord) - Math.abs(endCoord))
  // console.log("MIDDLE COORD", distance, pathCoord)
  let middleCoord = distance * 2
  if(pathCoord <= middleCoord){
    pathCoord += 0.001
  } else pathCoord -= 0.001
  
  res = pathCoord
  // console.log("RES", res)
  return res
}

//Redundant
export function useImage (url) {
    console.log("IMPORT META", url, `@/assets/${url}`)
    return new URL(`@/assets/${url}`, import.meta.url).href;
}

//Unused
export function delayedNavigation(path, delay) {
  console.log("this router", router)
  setTimeout(() => {
    router.push(path).catch(err => {
      console.log("error while routing", err)
    });
  }, delay);
}

// limits rate of function execution. First arg is the function to be executed, second is time between execution
export function debounce (func, wait) {
  let timeout;

  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
}