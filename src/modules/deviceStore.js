import { defineStore } from 'pinia'
import { global } from '@/modules/pinia'
import { logDebug, logError, logInfo } from '@/modules/logger'

export class Device {
    constructor(id, chipId, chipFamily, software, mdns, config, bleColor, url, description) {
        this.id = id
        this.chipId = chipId
        this.chipFamily = chipFamily
        this.software = software
        this.mdns = mdns
        this.config = config
        this.bleColor = bleColor
        this.url = url
        this.description = description
    }

    static fromJson(d) {
        return new Device(d.id, d.chipId, d.chipFamily, d.software, d.mdns, d.config, d.bleColor, d.url, d.description)
    }

    toJson() {
        return {
            "chipId": this.chipId,
            "chipFamily": this.chipFamily,
            "software": this.software,
            "mdns": this.mdns,
            "config": this.config,
            "bleColor": this.bleColor,
            "url": this.url,
            "description": this.description
        }
    }

    get id() { return this._id }
    get chipId() { return this._chipId }
    get chipFamily() { return this._chipFamily }
    get software() { return this._software }
    get mdns() { return this._mdns }
    get config() { return this._config }
    get bleColor() { return this._bleColor }
    get url() { return this._url }
    get description() { return this._description }

    set id(id) { this._id = id }
    set chipId(chipId) { this._chipId = chipId }
    set chipFamily(chipFamily) { this._chipFamily = chipFamily }
    set software(software) { this._software = software }
    set mdns(mdns) { this._mdns = mdns }
    set config(config) { this._config = config }
    set bleColor(bleColor) { this._bleColor = bleColor }
    set url(url) { this._url = url }
    set description(description) { this._description = description }
}

export const useDeviceStore = defineStore('deviceStore', {
    state: () => {
        return { devices: [] }
    },
    getters: {
        deviceList() {
            return this.devices
        },
    },
    actions: {
        getDeviceList(callback) {
            // callback => (success, devices[])

            logDebug("deviceStore.getDeviceList()")
            global.disabled = true
            fetch(global.baseURL + 'api/device/', {
                method: "GET",
                headers: { "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    logDebug("deviceStore.getDeviceList()", res.status)
                    if (!res.ok) throw res
                    return res.json()
                })
                .then(json => {
                    logDebug("deviceStore.getDeviceList()", json)
                    this.devices = []

                    json.forEach(d => {
                        var device = Device.fromJson(d)
                        this.devices.push(device)
                    });

                    callback(true, this.devices)
                    global.disabled = false
                })
                .catch(err => {
                    global.disabled = false
                    logError("deviceStore.getDeviceList()", err)
                    callback(false, null)
                })
        },
        getDevice(id, callback) {
            // callback => (success, device)

            logDebug("deviceStore.getDevice()", id)
            global.disabled = true
            fetch(global.baseURL + 'api/device/' + id, {
                method: "GET",
                headers: { "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    logDebug("deviceStore.getDevice()", res.status)
                    if (!res.ok) throw res
                    return res.json()
                })
                .then(json => {
                    logDebug("deviceStore.getDevice()", json)
                    var device = Device.fromJson(json)
                    callback(true, device)
                    global.disabled = false
                })
                .catch(err => {
                    global.disabled = false
                    logError("deviceStore.getDevice()", err)
                    callback(false, null)
                })
        },
        updateDevice(d, callback) {
            // callback => (success)

            logDebug("deviceStore.updateDevice()", d.id, d.toJson())
            global.disabled = true
            fetch(global.baseURL + 'api/device/' + d.id, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                body: JSON.stringify(d.toJson()),
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    logDebug("deviceStore.updateDevice()", res.status)
                    if (res.status != 200) {
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                })
                .catch(err => {
                    logError("deviceStore.updateDevice()", err)
                    callback(false)
                    global.disabled = false
                })
        },
        addDevice(d, callback) {
            // callback => (success)

            logDebug("deviceStore.addDevice()", d.toJson())
            global.disabled = true
            fetch(global.baseURL + 'api/device/', {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                body: JSON.stringify(d.toJson()),
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    logDebug("deviceStore.addDevice()", res.status)
                    if (res.status != 201) {
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                })
                .catch(err => {
                    logError("deviceStore.addDevice()", err)
                    callback(false)
                    global.disabled = false
                })
        },
        deleteDevice(id, callback) {
            // callback => (success)

            logDebug("deviceStore.deleteDevice()", id)
            global.disabled = true
            fetch(global.baseURL + 'api/device/' + id, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    logDebug("deviceStore.deleteDevice()", res.status)
                    if (res.status != 204) {
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                })
                .catch(err => {
                    logError("deviceStore.deleteDevice()", err)
                    callback(false)
                    global.disabled = false
                })
        },
        proxyRequest(url, method, body, callback) {
            // callback => (success, json_response)

            var body = { url: url, method: method, body: body }
            logDebug("deviceStore.proxyRequest()", url, body)
            fetch(global.baseURL + 'api/device/proxy_fetch/', {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    logDebug("deviceStore.proxyRequest()", res.status)
                    if (!res.ok) throw res
                    return res.json()
                })
                .then(json => {
                    logDebug("deviceStore.proxyRequest()", json)
                    callback(true, json)
                })
                .catch(err => {
                    logError("deviceStore.proxyRequest()", err)
                    callback(false, null)
                })
        },
        searchNetwork(url, callback) {
            // callback => (success, json_response)
            // mdns = { "type": type, "host": adresses, "name": host }

            logDebug("deviceStore.searchNetwork()", url)
            global.disabled = true
            fetch(global.baseURL + 'api/device/mdns/', {
                method: "GET",
                headers: { "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    logDebug("deviceStore.searchNetwork()", res.status)
                    if (!res.ok) throw res
                    return res.json()
                })
                .then(json => {
                    logDebug("deviceStore.searchNetwork()", json)
                    callback(true, json)
                    global.disabled = false
                })
                .catch(err => {
                    global.disabled = false
                    logError("deviceStore.searchNetwork()", err)
                    callback(false, null)
                })
        },
    }
})