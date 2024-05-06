import { ref } from 'vue'
import { createPinia } from "pinia"
import { useGlobalStore } from "@/modules/globalStore"
import { useConfigStore } from "@/modules/configStore"
import { useDeviceStore } from "@/modules/deviceStore"
import { useBatchStore } from "@/modules/batchStore"
import { useGravityStore } from "@/modules/gravityStore"
import { logDebug, logError, logInfo } from '@/modules/logger'

export const piniaInstance = createPinia()

const config = useConfigStore(piniaInstance)
const global = useGlobalStore(piniaInstance)
const deviceStore = useDeviceStore(piniaInstance)
const batchStore = useBatchStore(piniaInstance)
const gravityStore = useGravityStore(piniaInstance)

export { global, config, deviceStore, batchStore, gravityStore }

const configCompare = ref(null)

const saveConfigState = () => {
    logDebug("pinia.saveConfigState()")

    configCompare.value = {}
    for (var key in config) {
        if( typeof(config[key]) !== "function" && key !== "$id") {
            configCompare.value[key] = config[key]
        }
    }

    logDebug("pinia.saveConfigState()", "Saved state: ", configCompare.value)
    global.configChanged = false
}

const getConfigChanges = () => {
    logDebug("pinia.getConfigChanges()")
    var changes = {}

    if (configCompare.value === null) {
        logError("pinia.getConfigChanges()", "configState not saved")
        return changes
    }

    for (var key in configCompare.value) {
        if (configCompare.value[key] != config[key]) {
            changes[key] = config[key]
        } 
    }

    return changes
}

config.$subscribe((mutation, state) => {
    logDebug("pinia.subscribe()")

    if(!global.initialized)
        return

    var changes = getConfigChanges()
    logDebug("pinia.subscribe()", "State change on configStore", changes)

    if(JSON.stringify(changes).length > 2) {
        global.configChanged = true
        logDebug("pinia.subscribe()", "Changed properties:", changes)
    } else {
        global.configChanged = false
    }
})

export { saveConfigState, getConfigChanges }