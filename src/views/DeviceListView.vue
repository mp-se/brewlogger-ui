<template>
  <div class="container">
    <p></p>
    <p class="h3">Device List</p>
    <hr>
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col-sm-1">ID</th>
          <th scope="col-sm-3">mDNS</th>
          <th scope="col-sm-1">Chip ID</th>
          <th scope="col-sm-1">Chip Family</th>
          <th scope="col-sm-2">Software</th>
          <th scope="col-sm-2">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in deviceList" :key="d.id">
          <th scope="row">{{ d.id }}</th>
          <td>{{ d.mdns }}</td>
          <td>{{ d.chipId }}</td>
          <td>{{ d.chipFamily }}</td>
          <td>{{ d.software }}</td>
          <td>
            <router-link :to="{ name: 'device', params: { id: d.id } }">
              <button type="button" class="btn btn-primary btn-sm"><i class="bi bi-pencil-square"></i></button>
            </router-link>&nbsp;
            <button type="button" class="btn btn-danger btn-sm" @click.prevent="deleteDevice(d.id, d.mdns)"><i
                class="bi bi-file-x"></i></button>&nbsp;

            <template v-if="d.software == 'Brewpi'">
              <router-link :to="{ name: 'device-brewpi', params: { id: d.id } }">
                <button type="button" class="btn btn-info btn-sm"><i class="bi bi-thermometer-snow"></i></button>
              </router-link>&nbsp;
            </template>

            <router-link v-if="batchStore.anyBatchesForDevice(d.chipId)"
              :to="{ name: 'batch-list', query: { chipId: d.chipId } }">
              <button type="button" class="btn btn-success btn-sm"><i class="bi bi-boxes"></i></button>
            </router-link>&nbsp;
          </td>
        </tr>
      </tbody>
    </table>

    <div class="row">
      <div class="col-md-12">
        <router-link :to="{ name: 'device', params: { id: 'new' } }">
          <button type="button" class="btn btn-secondary">Add Device</button>
        </router-link>&nbsp;

        <button disabled type="button" class="btn btn-secondary">Search for Devices</button>&nbsp;
      </div>
    </div>

    <BsModalConfirm :callback="confirmDeleteCallback" :message="confirmDeleteMessage" id="deleteDevice"
      title="Delete device" :disabled="global.disabled" />

  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { global, deviceStore, batchStore } from "@/modules/pinia"
import { logDebug, logError, logInfo } from '@/modules/logger'

const confirmDeleteMessage = ref(null)
const confirmDeleteId = ref(null)

// TODO: Add function/view to search for devices on network

const deviceList = ref(null);

onMounted(() => {
  logDebug("DeviceListView.onMounted()")
  deviceList.value = deviceStore.deviceList
})

function updateDeviceList() {
  logDebug("DeviceListView.updateDeviceList()")

  deviceStore.getDeviceList((success, dl) => {
    if (success) {
      deviceList.value = dl
    } else {
      global.messageError = "Failed to load device list"
    }
  })
}

const confirmDeleteCallback = (result) => {
  logDebug("DeviceListView.confirmDeleteCallback()", result)

  if (result) {
    global.disabled = true
    global.clearMessages()

    deviceStore.deleteDevice(confirmDeleteId.value, (success) => {
      if (success)
        global.messageSuccess = "Deleted device"
      else
        global.messageError = "Failed to delete device"

      updateDeviceList()
      global.disabled = false
    })
  }
}

const deleteDevice = (id, name) => {
  logDebug("DeviceListView.deleteDevice()", id, name)

  confirmDeleteMessage.value = "Do you really want to delete device ''" + name + "'"
  confirmDeleteId.value = id
  document.getElementById('deleteDevice').click()
}
</script>