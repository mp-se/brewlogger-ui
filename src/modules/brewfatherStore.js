import { defineStore } from 'pinia'
import { global } from '@/modules/pinia'
import { logDebug, logError } from '@/modules/logger'

export class BrewfatherBatch {
  constructor(brewfatherId, name, brewDate, style, brewer, abv, ebc, ibu) {
    this.name = name === undefined ? '' : name
    this.brewDate = brewDate === undefined ? '' : brewDate
    this.style = style === undefined ? '' : style
    this.brewer = brewer === undefined ? '' : brewer
    this.abv = abv === undefined ? 0 : abv
    this.ebc = ebc === undefined ? 0 : ebc
    this.ibu = ibu === undefined ? 0 : ibu
    this.brewfatherId = brewfatherId === undefined ? '' : brewfatherId
  }

  static fromJson(d) {
    return new BrewfatherBatch(
      d.brewfatherId,
      d.name,
      d.brewDate,
      d.style,
      d.brewer,
      d.abv,
      d.ebc,
      d.ibu
    )
  }

  get brewfatherId() {
    return this._brewfatherId
  }
  get name() {
    return this._name
  }
  get brewDate() {
    return this._brewDate
  }
  get style() {
    return this._style
  }
  get brewer() {
    return this._brewer
  }
  get abv() {
    return this._abv
  }
  get ebc() {
    return this._ebc
  }
  get ibu() {
    return this._ibu
  }

  set brewfatherId(brewfatherId) {
    this._brewfatherId = brewfatherId
  }
  set name(name) {
    this._name = name
  }
  set brewDate(brewDate) {
    this._brewDate = brewDate
  }
  set style(style) {
    this._style = style
  }
  set brewer(brewer) {
    this._brewer = brewer
  }
  set abv(abv) {
    this._abv = abv
  }
  set ebc(ebc) {
    this._ebc = ebc
  }
  set ibu(ibu) {
    this._ibu = ibu
  }
}

export const useBrewfatherStore = defineStore('brewfatherStore', {
  state: () => {
    return { batches: [], valid: false }
  },
  getters: {
    isValid() {
      return this.valid
    },
    batchList() {
      return this.batches
    }
  },
  actions: {
    getBatchList(callback) {
      // callback => (success)

      if (this.isValid) {
        logDebug('brewfatherStore.getBatchList()', 'Cache is valid, skipping fetch!')
        callback(true)
        return
      }

      logDebug('brewfatherStore.getBatchList()')
      global.disabled = true
      fetch(global.baseURL + 'api/brewfather/batch/', {
        method: 'GET',
        headers: { Authorization: global.token },
        signal: AbortSignal.timeout(global.fetchTimout)
      })
        .then((res) => {
          logDebug('brewfatherStore.getBatchList()', res.status)
          if (!res.ok) throw res
          return res.json()
        })
        .then((json) => {
          logDebug(json)
          this.batches = []

          json.forEach((b) => {
            var batch = BrewfatherBatch.fromJson(b)
            this.batches.push(batch)
          })

          this.valid = true
          callback(true)
          global.disabled = false

          // Keep valid for 5 minutes
          setTimeout(() => {
            this.valid = false
          }, 60 * 5)
        })
        .catch((err) => {
          global.disabled = false
          logError('brewfatherStore.getBatchList()', err)
          callback(false)
        })
    }
  }
})