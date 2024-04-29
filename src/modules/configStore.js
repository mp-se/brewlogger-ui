import { defineStore } from 'pinia'
import { global, saveConfigState, getConfigChanges } from '@/modules/pinia'

export const useConfigStore = defineStore('config', {
    state: () => {
        return {
            id: 0,
            temperatureFormat: "",
            pressureFormat: "",
            gravityFormat: "",
            mdnsTimeout: 0,
            appVersion: 0,
            dark_mode: false // TODO: Name used in components
        }
    },
    actions: {
        load(callback) {
            global.disabled = true
            console.log("Fetching /api/config")
            fetch(global.baseURL + 'api/config', {
                method: "GET",
                headers: { "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => res.json())
                .then(json => {
                    console.log(json)
                    global.disabled = false
                    this.id = json.id
                    this.temperatureFormat = json.temperatureFormat
                    this.pressureFormat = json.pressureFormat
                    this.gravityFormat = json.gravityFormat
                    this.appVersion = json.appVersion
                    this.mdnsTimeout = json.mdnsTimeout
                    this.dark_mode = json.darkMode
                    callback(true)
                })
                .catch(err => {
                    global.disabled = false
                    console.log(err)
                    callback(false)
                })
        },
        save(callback) {
            global.disabled = true
            console.log("Sending /api/config")

            var data = {
                pressureFormat: this.pressureFormat,
                gravityFormat: this.gravityFormat,
                temperatureFormat: this.temperatureFormat,
                mdnsTimeout: this.mdnsTimeout,
                darkMode: this.dark_mode,
                version: "",
            }
          
            console.log(data)

            fetch(global.baseURL + 'api/config/' + this.id, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    if (res.status != 200) {
                        console.log("Sending /api/config failed", res.status)
                        callback(false)
                    }
                    else {
                        console.log("Sending /api/config completed")
                        saveConfigState()
                        callback(true)
                    }
                })
                .catch(err => {
                    console.log("Sending /api/config failed")
                    console.log(err)
                    callback(false)
                    global.disabled = false
                })
        },
    }
})