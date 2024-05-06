<template>
  <div class="container">
    <p></p>
    <p class="h3">Batch Gravity</p>
    <hr>

    <div class="row">

      <div class="col-md-12">
        <div class="row">
          <div class="col-md-1">
            <BsInputReadonly v-model="infoOG" label="OG"></BsInputReadonly>
          </div>
          <div class="col-md-1">
            <BsInputReadonly v-model="infoFG" label="FG"></BsInputReadonly>
          </div>
          <div class="col-md-1">
            <BsInputReadonly v-model="infoABV" label="ABV"></BsInputReadonly>
          </div>
          <div class="col-md-1">
            <BsInputReadonly v-model="infoHighTemp" label="Temp"></BsInputReadonly>
          </div>
          <div class="col-md-1">
            <BsInputReadonly v-model="infoLowTemp" label="Temp"></BsInputReadonly>
          </div>
          <div class="col-md-1">
            <BsInputReadonly v-model="infoReadings" label="#"></BsInputReadonly>
          </div>
          <div class="col-md-2">
            <BsInputReadonly v-model="infoFirstDay" label="First date"></BsInputReadonly>
          </div>
          <div class="col-md-2">
            <BsInputReadonly v-model="infoLastDay" label="Last date"></BsInputReadonly>
          </div>
        </div>
      </div>

      <div class="col-md-11">
        <canvas id="gravityChart"></canvas>
      </div>
      <div class="col-md-1">
        <div class="row p-2">
          Time
        </div>
        <div class="row p-2">
          <button @click="filterAll()" type="button" class="btn btn-secondary btn-sm">
            All
          </button>
        </div>
        <div class="row p-2">
          <button @click="filter24h()" type="button" class="btn btn-secondary btn-sm">
            24h
          </button>
        </div>
        <div class="row p-2">
          <button @click="filter48h()" type="button" class="btn btn-secondary btn-sm">
            48h
          </button>
        </div>
        <div class="row p-2">
          <button @click="filter7d()" type="button" class="btn btn-secondary btn-sm">
            7d
          </button>
        </div>
        <div class="row p-2">
          Filters
        </div>
        <div class="row p-2">
          <button @click="filterDownsampleLTTB()" type="button" class="btn btn-secondary btn-sm">
            LTTB
          </button>
        </div>
        <div class="row p-2">
          <button @click="filterDownsampleLTD()" type="button" class="btn btn-secondary btn-sm">
            LTD
          </button>
        </div>
        <div class="row p-2">
          <button @click="filterKalman()" type="button" class="btn btn-secondary btn-sm">
            Kalman
          </button>
        </div>
      </div>
    </div>

    <template v-if="gravity != null">

      <div class="row gy-2">
        <div class="col-md-12">
        </div>

        <router-link :to="{ name: 'batch-list' }">
          <button type="button" class="btn btn-secondary w-2"> <i class="bi bi-list"></i>
            Batch list
          </button>
        </router-link>&nbsp;
      </div>
    </template>

    <template v-else>

      <BsMessage :dismissable="false" :message="'Unable to find gravity for batch with id ' + $route.params.id"
        alert="danger" />

      <div class="row gy-2">
        <div class="col-md-12">
        </div>
        <div class="col-md-12">
          <router-link :to="{ name: 'batch-list' }">
            <button type="button" class="btn btn-secondary w-2">
              Batch list
            </button>
          </router-link>&nbsp;
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue"
import { Chart as ChartJS, Tooltip, Legend, LinearScale, TimeScale, LineController, PointElement, LineElement } from 'chart.js'
import 'date-fns'
import 'chartjs-adapter-date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'
import { config, gravityStore } from "@/modules/pinia"
import { router } from '@/modules/router'
import { gravityToPlato, tempToF, abv } from "@/modules/utils"
import { logDebug, logError, logInfo } from '@/modules/logger'
import { ASAP, SMA, LTOB, LTTB, LTD } from 'downsample';
import { KalmanFilter } from 'kalman-filter'

var chart = null // Do not use ref for this points, will cause stack overflow...

const infoFG = computed(() => { return new Number(statisticData.value.gravity.min).toFixed(3) })
const infoOG = computed(() => { return new Number(statisticData.value.gravity.max).toFixed(3) })
const infoABV = computed(() => { return new Number(statisticData.value.abv).toFixed(2) + '%' })
const infoLowTemp = computed(() => { return new Number(statisticData.value.temperature.min).toFixed(2) + config.tempUnit })
const infoHighTemp = computed(() => { return new Number(statisticData.value.temperature.max).toFixed(2) + config.tempUnit })
const infoFirstDay = computed(() => { return statisticData.value.date.first.substring(0, 10) })
const infoLastDay = computed(() => { return statisticData.value.date.last.substring(0, 10) })
const infoReadings = computed(() => { return statisticData.value.readings })

const gravity = ref(null)
const statisticData = ref({
  gravity: {
    min: 0, // FG
    max: 0, // OG
  },
  temperature: {
    min: 0,
    max: 0,
  },
  abv: 0,
  date: {
    first: "",
    last: "",
  },
  readings: 0,
})
const gravityData = ref([])
//const pressureData = ref([])
const batteryData = ref([])
const temperatureData = ref([])
const chartData = ref({
  datasets: [{
    label: "Gravity",
    data: gravityData.value,
    borderColor: 'green',
    backgroundColor: 'green',
    yAxisID: 'y1',
    pointRadius: 0,
  }, {
    label: "Temperature",
    data: temperatureData.value,
    borderColor: 'blue',
    backgroundColor: 'blue',
    yAxisID: 'y2',
    pointRadius: 0,
  }, {
    label: "Battery",
    data: batteryData.value,
    borderColor: 'orange',
    backgroundColor: 'orange',
    yAxisID: 'y3',
    pointRadius: 0,
  }/*{
    label: "Pressure",
    data: pressureData.value,
    borderColor: 'red',
    backgroundColor: 'red',
    yAxisID: 'y4',
    pointRadius: 0,
  }, */]
})

const scaleOptions = ref({
  x: {
    type: 'time',
    time: {
      unit: 'hour',
      displayFormats: {
        hour: 'E HH:mm',
        day: 'HH:mm',
        week: 'E HH:mm',
        month: 'd HH:mm',
      }
    },
    min: 0,
    max: 0,
  },
  y1: {
    type: 'linear',
    position: 'left',
    title: {
      display: true,
      text: 'Gravity',
    },
  },
  y2: {
    type: 'linear',
    position: 'right',
    title: {
      display: true,
      text: 'Temperataure',
    },
  },
  y3: {
    type: 'linear',
    position: 'right',
    title: {
      display: true,
      text: 'Voltage',
    },
  },
  /*y4: {
    type: 'linear',
    position: 'left',
    title: {
      display: true,
      text: 'Pressure',
    },
  }*/
})

const chartOptions = ref({
  type: 'line',
  data: chartData.value,
  options: {
    scales: scaleOptions.value,
    animation: false,
  },
  plugins: {
    tooltip: {
      enabled: false,
    },
    zoom: {
      pan: {
        enabled: true,
        mode: 'xy',
        modifierKey: 'ctrl',
      },
      zoom: {
        drag: {
          enabled: true
        },
        mode: 'xy',
      },
    }
  },
})

onMounted(() => {
  logDebug("BatchGravityView.onMounted()")

  //ChartJS.register(Legend, Tooltip, LinearScale, TimeScale, PointElement, LineController, LineElement, zoomPlugin)
  ChartJS.register(Legend, LinearScale, TimeScale, PointElement, LineController, LineElement, zoomPlugin)

  gravity.value = null

  gravityStore.getGravityListForBatch(router.currentRoute.value.params.id, (success, gl) => {
    if (success) {
      gravity.value = gl
      logDebug(gravity.value)
      updateDataset()

      try {
        logDebug("BatchGravityView.onMounted()", chartOptions.value)

        if (document.getElementById('gravityChart') == null) {
          logError("BatchGravityView.onMounted()", "Unable to find the chart canvas")
        } else {
          // Create the chart
          scaleOptions.value.x.min = statisticData.value.date.first
          scaleOptions.value.x.max = statisticData.value.date.last
          chart = new ChartJS(document.getElementById('gravityChart'), chartOptions.value)
          logDebug("BatchGravityView.onMounted()", chart)
        }
      } catch (err) {
        logDebug(err)
      }
    } else {
      // global.messageError = "Failed to load gravity " + id
    }
  })
})

function updateDataset() {
  logDebug("BatchGravityView.updateDataset()")

  if (gravity.value == null)
    return

  var minGravity = 2.0
  var maxGravity = 0.0
  var minTemperature = 100.0
  var maxTemperature = -100.0

  // Sort the gravity data so its in date order
  gravity.value.sort((a, b) => Date.parse(a.created) - Date.parse(b.created))

  // Process the gravity readings
  gravity.value.forEach(g => {
    // Validate the datapoints if they are withing reasonable 
    var valid = false

    if (g.gravity > 1.0 && g.gravity < 1.1)
      valid = true

    if (valid) {
      // Calculate some statistics for gravity and temperature
      if (g.gravity > maxGravity)
        maxGravity = g.gravity
      if (g.gravity < minGravity)
        minGravity = g.gravity

      if (g.temperature > maxTemperature)
        maxTemperature = g.temperature
      if (g.temperature < minTemperature)
        minTemperature = g.temperature

      // Map the attributes into datasets
      var gravity = config.isGravitySG ? g.gravity : gravityToPlato(g.gravity)
      var temperature = config.isTempC ? g.temperature : tempToF(g.temperature)

      //logDebug(g.created, g.gravity, g.battery, g.temperature)

      gravityData.value.push({ x: g.created, y: gravity })
      batteryData.value.push({ x: g.created, y: g.battery })
      temperatureData.value.push({ x: g.created, y: temperature })
    }
  })

  statisticData.value.gravity.min = config.isGravitySG ? minGravity : gravityToPlato(minGravity)
  statisticData.value.gravity.max = config.isGravitySG ? maxGravity : gravityToPlato(maxGravity)
  statisticData.value.temperature.min = config.isTempC ? minTemperature : tempToF(minTemperature)
  statisticData.value.temperature.max = config.isTempC ? maxTemperature : tempToF(maxTemperature)
  statisticData.value.abv = abv(maxGravity, minGravity)
  statisticData.value.readings = gravity.value.length

  logDebug(statisticData.value.gravity.min, statisticData.value.gravity.max)

  if (gravity.value.length) {
    statisticData.value.date.first = gravity.value[0].created
    statisticData.value.date.last = gravity.value[gravity.value.length - 1].created
  }

  logDebug("BatchGravityView.updateDataset()", statisticData.value)
}

function filter24h() {
  logDebug("BatchGravityView.filter24h()")

  chart.options.scales.x.min = Date.parse(statisticData.value.date.last) - 86400000
  chart.options.scales.x.max = Date.parse(statisticData.value.date.last)
  chart.update()
}

function filter48h() {
  logDebug("BatchGravityView.filter48h()")

  chart.options.scales.x.min = Date.parse(statisticData.value.date.last) - (86400000 * 2)
  chart.options.scales.x.max = Date.parse(statisticData.value.date.last)
  chart.update()
}

function filter7d() {
  logDebug("BatchGravityView.filter7d()")

  chart.options.scales.x.min = Date.parse(statisticData.value.date.last) - (86400000 * 7)
  chart.options.scales.x.max = Date.parse(statisticData.value.date.last)
  chart.update()
}

function filterAll() {
  logDebug("BatchGravityView.filterAll()")

  chart.options.scales.x.min = Date.parse(statisticData.value.date.first)
  chart.options.scales.x.max = Date.parse(statisticData.value.date.last)

  chart.data.datasets[0].data = gravityData.value
  chart.data.datasets[1].data = temperatureData.value 
  chart.data.datasets[2].data = batteryData.value
  chart.update()
}

function filterDownsampleLTTB() {
  logDebug("BatchGravityView.filterDownsampleLTTB()")

  var count = chart.data.datasets[0].data.length / 2
  chart.data.datasets[0].data = applyLTTB(chart.data.datasets[0].data, count)
  chart.data.datasets[1].data = applyLTTB(chart.data.datasets[1].data, count)
  chart.data.datasets[2].data = applyLTTB(chart.data.datasets[2].data, count)
  /*
  var count = statisticData.value.readings / 2
  chart.data.datasets[0].data = applyLTTB(gravityData.value, count)
  chart.data.datasets[1].data = applyLTTB(temperatureData.value, count)
  chart.data.datasets[2].data = applyLTTB(batteryData.value, count)
  */
  chart.update()
}

function filterDownsampleLTD() {
  logDebug("BatchGravityView.filterDownsampleLTD()")

  var count = chart.data.datasets[0].data.length / 2
  chart.data.datasets[0].data = applyLTD(chart.data.datasets[0].data, count)
  chart.data.datasets[1].data = applyLTD(chart.data.datasets[1].data, count)
  chart.data.datasets[2].data = applyLTD(chart.data.datasets[2].data, count)
  /*
  var count = statisticData.value.readings / 4
  chart.data.datasets[0].data = applyLTD(gravityData.value, count)
  chart.data.datasets[1].data = applyLTD(temperatureData.value, count)
  chart.data.datasets[2].data = applyLTD(batteryData.value, count)
  */
  chart.update()
}

function filterKalman() {
  logDebug("BatchGravityView.filterKalman()")

  chart.data.datasets[0].data = applyKalman(chart.data.datasets[0].data)
  chart.data.datasets[1].data = applyKalman(chart.data.datasets[1].data) 
  chart.data.datasets[2].data = applyKalman(chart.data.datasets[2].data) 
  /*
  chart.data.datasets[0].data = applyKalman(gravityData.value)
  chart.data.datasets[1].data = applyKalman(temperatureData.value) 
  chart.data.datasets[2].data = applyKalman(batteryData.value) 
  */
  chart.update()
}

function applyLTTB(input, points) {
  logDebug("BatchGravityView.applyLTTB()")

  var data = []

  // Map data to a format that can be handled by the library
  input.forEach(i => {
    data.push([new Date(i.x), i.y])
  })

  const downsampled = LTTB(data, points)

  // Map data back to chart format
  data = []
  downsampled.forEach(d => {
    data.push({ x: d[0].toISOString(), y: d[1] })
  })

  return data
}

function applyLTD(input, points) {
  logDebug("BatchGravityView.applyLTD()")

  var data = []

  // Map data to a format that can be handled by the library
  input.forEach(i => {
    data.push([new Date(i.x), i.y])
  })

  const downsampled = LTD(data, points)

  // Map data back to chart format
  data = []
  downsampled.forEach(d => {
    logDebug(d)
    data.push({ x: d[0].toISOString(), y: d[1] })
  })

  return data
}

function applyKalman(input) {
  logDebug("BatchGravityView.applyKalman()")

  var data = []

  // Map data to a format that can be handled by the library
  input.forEach(i => {
    data.push([Date.parse(i.x), i.y])
  })

  const filtered = new KalmanFilter({ observation: 2, dynamic: 'constant-speed' }).filterAll(data)

  // Map data back to chart format
  data = []
  filtered.forEach(f => {
    data.push({ x: new Date(f[0]).toISOString(), y: f[1] })
  })

  return data
}
</script>