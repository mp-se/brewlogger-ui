import { defineStore } from 'pinia'
import { logDebug, logError, logInfo } from '@/modules/logger'

export const useGlobalStore = defineStore('global', {
  state: () => {
    return {
      initialized: false,
      disabled: false,
      configChanged: false,

      messageError: "",
      messageWarning: "",
      messageSuccess: "",
      messageInfo: "",

      fetchTimout: 8000,
    }
  },
  getters: {
    isError() {
      return this.messageError != "" ? true : false
    },
    isWarning() {
      return this.messageWarning != "" ? true : false
    },
    isSuccess() {
      return this.messageSuccess != "" ? true : false
    },
    isInfo() {
      return this.messageInfo != "" ? true : false
    },
    baseURL() {
      if(process.env.VUE_APP_HOST === undefined) {
        logDebug("globalStore.baseURL()", "Using base URL from browser", window.location.href)
        return  window.location.href
      }

      logDebug("globalStore.baseURL()", "Using base URL from env", process.env.VUE_APP_HOST)
      return process.env.VUE_APP_HOST
    },
    token() {
      if(process.env.VUE_APP_TOKEN == undefined) {

        // TODO: Figure out how to store the API key in production

        return "Bearer akljnv13bvi2vfo0b0bw789jlljsdf"
      }


      return "Bearer " + process.env.VUE_APP_TOKEN
    },
    uiVersion() {
      return process.env.VUE_APP_VERSION
    },
    uiBuild() {
      return process.env.VUE_APP_BUILD
    }
  },
  actions: {
    clearMessages() {
      this.messageError = ""
      this.messageWarning = ""
      this.messageSuccess = ""
      this.messageInfo = ""
    }
  },
})