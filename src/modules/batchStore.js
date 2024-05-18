import { defineStore } from 'pinia'
import { global } from '@/modules/pinia'
import { logDebug, logError, logInfo } from '@/modules/logger'

export class Batch {
    constructor(id, name, description, chipId, active, brewDate, style, brewer, abv, ebc, ibu, brewfatherId, gravity) {
        this.id = id
        this.name = name
        this.description = description
        this.chipId = chipId
        this.active = active
        this.brewDate = brewDate
        this.style = style
        this.brewer = brewer
        this.abv = abv
        this.ebc = ebc
        this.ibu = ibu
        this.brewfatherId = brewfatherId
        this.gravityCount = gravity.length
   }

    static fromJson(d) {
        return new Batch(d.id, d.name, d.description, d.chipId, d.active, d.brewDate, d.style, d.brewer, d.abv, d.ebc, d.ibu, d.brewfatherId, d.gravity)
    }

    toJson() {
        return {
            "name": this.name,
            "description": this.description,
            "chipId": this.chipId,
            "active": this.active,
            "brewDate": this.brewDate,
            "style": this.style,
            "brewer": this.brewer,
            "abv": this.abv,
            "ebc": this.ebc,
            "ibu": this.ibu,
            "brewfatherId": this.brewfatherId
        }
    }

    get id() { return this._id }
    get name() { return this._name }
    get description() { return this._description }
    get chipId() { return this._chipId }
    get active() { return this._active }
    get brewDate() { return this._brewDate }
    get style() { return this._style }
    get brewer() { return this._brewer }
    get abv() { return this._abv }
    get ebc() { return this._ebc }
    get ibu() { return this._ibu }
    get brewfatherId() { return this._brewfatherId }
    get gravityCount() { return this._gravityCount }

    set id(id) { this._id = id }
    set name(name) { this._name = name }
    set description(description) { this._description = description }
    set chipId(chipId) { this._chipId = chipId }
    set active(active) { this._active = active }
    set brewDate(brewDate) { this._brewDate = brewDate }
    set style(style) { this._style = style }
    set brewer(brewer) { this._brewer = brewer }
    set abv(abv) { this._abv = abv }
    set ebc(ebc) { this._ebc = ebc }
    set ibu(ibu) { this._ibu = ibu }
    set brewfatherId(brewfatherId) { this._brewfatherId = brewfatherId }
    set gravityCount(gravityCount) { this._gravityCount = gravityCount }
}

export const useBatchStore = defineStore('batchStore', {
    state: () => {
        return { batches: [] }
    },
    getters: {
        batchList() {
            return this.batches
        },
    },
    actions: {
        anyBatchesForDevice(chipId) {
            logDebug("batchStore.anyBatchesForDevice()")

            var found = false
            this.batches.forEach(b => {
                if(b.chipId == chipId)
                    found = true
            })
            return found
        },
        getBatchList(callback) {
            // callback => (success, batches[])

            logDebug("batchStore.getBatchList()")
            global.disabled = true
            fetch(global.baseURL + 'api/batch/', {
                method: "GET",
                headers: { "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    logDebug("batchStore.getBatchList()", res.status)
                    if (!res.ok) throw res
                    return res.json()
                })
                .then(json => {
                    logDebug(json)
                    this.batches = []

                    json.forEach(b => {
                        var batch = Batch.fromJson(b)
                        this.batches.push(batch)
                    });

                    callback(true, this.batches)
                    global.disabled = false
                })
                .catch(err => {
                    global.disabled = false
                    logError("batchStore.getBatchList()", err)
                    callback(false, [])
                })
        },
        getBatch(id, callback) {
            // callback => (success, batch)

            logDebug("batchStore.getBatch()", id)
            global.disabled = true
            fetch(global.baseURL + 'api/batch/' + id, {
                method: "GET",
                headers: { "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    logDebug("batchStore.getBatch()", res.status)
                    if (!res.ok) throw res
                    return res.json()
                })
                .then(json => {
                    logDebug("batchStore.getBatch()", json)
                    var batch = Batch.fromJson(json)
                    callback(true, batch)
                    global.disabled = false
                })
                .catch(err => {
                    global.disabled = false
                    logError("batchStore.getBatch()", err)
                    callback(false, null)
                })
        },
        updateBatch(b, callback) {
            // callback => (success)

            logDebug("batchStore.updateBatch()", b.id, b.toJson())
            global.disabled = true
            fetch(global.baseURL + 'api/batch/' + b.id, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                body: JSON.stringify(b.toJson()),
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    logDebug("batchStore.updateBatch()", res.status)
                    if (res.status != 200) {
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                })
                .catch(err => {
                    logError("batchStore.updateBatch()", err)
                    callback(false)
                    global.disabled = false
                })
        },
        addBatch(b, callback) {
            // callback => (success)

            logDebug("batchStore.addBatch()", b.toJson())
            global.disabled = true
            fetch(global.baseURL + 'api/batch/', {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                body: JSON.stringify(b.toJson()),
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    logDebug("batchStore.addBatch()", res.status)
                    if (res.status != 201) {
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                })
                .catch(err => {
                    logError("batchStore.addBatch()", err)
                    callback(false)
                    global.disabled = false
                })
        },
        deleteBatch(id, callback) {
            // callback => (success)

            logDebug("batchStore.deleteBatch()", id)
            global.disabled = true
            fetch(global.baseURL + 'api/batch/' + id, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authorization": global.token },
                signal: AbortSignal.timeout(global.fetchTimout),
            })
                .then(res => {
                    global.disabled = false
                    logDebug("batchStore.deleteBatch()", res.status)
                    if (res.status != 204) {
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                })
                .catch(err => {
                    logError("batchStore.deleteBatch()", err)
                    callback(false)
                    global.disabled = false
                })
        },
    }
})