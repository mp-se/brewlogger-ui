<template>
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <p></p>
        <p class="h3">Batch List</p>
      </div>
      <div class="col-md-4">
        <BsSelect v-model="filterDevice" :options="deviceList" help="" :disabled="global.disabled">
        </BsSelect>
      </div>
    </div>

    <hr>
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col-sm-1">ID</th>
          <th scope="col-sm-2">Name</th>
          <th scope="col-sm-1">Brewdate</th>
          <th scope="col-sm-1">Device</th>
          <th scope="col-sm-1">Active</th>
          <th scope="col-sm-1">Gravity #</th>
          <th scope="col-sm-2">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in batchList" :key="b.id">
          <th scope="row">{{ b.id }}</th>
          <td>{{ b.name }}</td>
          <td>{{ b.brewDate }}</td>
          <td>{{ b.chipId }}</td>
          <td>{{ b.active }}</td>
          <td>{{ b.gravityCount }}</td>
          <td>
            <router-link :to="{ name: 'batch', params: { id: b.id } }">
              <button type="button" class="btn btn-primary btn-sm"><i class="bi bi-pencil-square"></i></button>
            </router-link>&nbsp;
            <button type="button" class="btn btn-danger btn-sm" @click.prevent="deleteBatch(b.id, b.name)"><i
                class="bi bi-file-x"></i></button>&nbsp;
            <router-link :to="{ name: 'batch-gravity', params: { id: b.id } }">
              <button type="button" class="btn btn-success btn-sm"><i class="bi bi-graph-down"></i></button>
            </router-link>&nbsp;

            <!-- 
              <button type="button" class="btn btn-info btn-sm"><i class="bi bi-eye"></i></button>&nbsp;
              <button type="button" class="btn btn-dark btn-sm"><i class="bi bi-boxes"></i></button>&nbsp;
            -->
          </td>
        </tr>
      </tbody>
    </table>

    <div class="row">
      <div class="col-md-12">
        <router-link :to="{ name: 'batch', params: { id: 'new' } }">
          <button type="button" class="btn btn-secondary">Add Batch</button>
        </router-link>&nbsp;
      </div>
    </div>

    <BsModalConfirm :callback="confirmDeleteCallback" :message="confirmDeleteMessage" id="deleteBatch"
      title="Delete batch" :disabled="global.disabled" />

  </div>

</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { global, batchStore, deviceStore } from "@/modules/pinia"
import { logDebug, logError, logInfo } from '@/modules/logger'
import { router } from '@/modules/router'

const confirmDeleteMessage = ref(null)
const confirmDeleteId = ref(null)

const batchList = ref(null);
const deviceList = ref([])
const filterDevice = ref('*')

onMounted(() => {
  logDebug("BatchListView.onMounted()")

  var query = router.currentRoute.value.query

  if(query.hasOwnProperty("chipId")) {
    logDebug("BatchListView.onMounted()", "Filter by chipId", query.chipId)
    filterDevice.value = query.chipId
  }

  filterBatchList(filterDevice.value)
  deviceList.value.push({ label: 'All', value: '*' })
  deviceStore.deviceList.forEach(d => {
    deviceList.value.push({ label: d.chipId + ' (' + d.mdns + ')', value: d.chipId })
  })
})

function filterBatchList(filter) {
  logDebug("BatchListView.filterBatchList", filter)

  logDebug(this)

  if(filter == "*") {
    batchList.value = batchStore.batchList
  } else {
    batchList.value = []
    batchStore.batchList.forEach(b => {
      if(b.chipId == filter)
        batchList.value.push(b)
    })
  }
}

watch(filterDevice, async (selected, previous) => {
  logDebug("BatchListView.watch(filterDevice)", selected)
  filterBatchList(selected)
})

function updateBatchList() {
  logDebug("DeviceListView.updateBatchList()")

  batchStore.getBatchList((success, bl) => {
    if (success) {
      batchList.value = bl
    } else {
      global.messageError = "Failed to load batch list"
    }
  })
}

const confirmDeleteCallback = (result) => {
  logDebug("BatchListView.confirmDeleteCallback()", result)

  if (result) {
    global.disabled = true
    global.clearMessages()

    batchStore.deleteBatch(confirmDeleteId.value, (success) => {
      if (success)
        global.messageSuccess = "Deleted batch"
      else
        global.messageError = "Failed to batch device"

      updateBatchList()
      global.disabled = false
    })
  }
}

const deleteBatch = (id, name) => {
  logDebug("BatchListView.deleteBatch()", id, name)

  confirmDeleteMessage.value = "Do you really want to delete batch ''" + name + "''"
  confirmDeleteId.value = id
  document.getElementById('deleteBatch').click()
}
</script>