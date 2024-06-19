import { debounce } from '@/helpers/globalFunctions.js'

const debounceInterval = 0; // milliseconds
let mouseDown = false;


function debouncedMouseMove (event, target, debouncedFunction){
  if(mouseDown){
    debounce( debouncedFunction(event, target), debounceInterval )
  }
}

export function initializeMouseEvents(target = null, container){ //Mesh target

  container.addEventListener("mousedown", () => {
    mouseDown = true;
  })

  container.addEventListener("mousemove", (event) => {
    // console.log("mouse move")
    debouncedMouseMove(event, target)
  })

  container.addEventListener("mouseup", () => {
    mouseDown = false;
  })
}