import { ref } from 'vue'

const debug = ref(true)
const info = ref(true)

export function logDebug(...args) {
  if(debug.value)
    console.log(...args)
}

export function logInfo(...args) {
  if(info.value)
    console.log(...args)
}

export function logError(...args) {
  console.log(...args)
}
