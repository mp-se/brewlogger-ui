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
      if(process.env.VUE_APP_HOST === undefined)
        return  window.location.href

      logDebug("globalStore.baseURL()", "Using base URL from env", process.env.VUE_APP_HOST)
      return process.env.VUE_APP_HOST
    },
    token() {
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