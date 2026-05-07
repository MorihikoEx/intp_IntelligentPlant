<script setup>
import {computed} from 'vue'

const props = defineProps({
  sensorData: {
    type: Object,
    default: null,
  },
})

const toPercent = (raw) => {
  if (raw === null || raw === undefined || Number.isNaN(Number(raw))) {
    return null
  }

  const value = Math.max(0, Math.min(4095, Number(raw)))
  return 100 - Math.round((value * 100) / 4095)
}

const lightPercentText = computed(() => {
  const value = toPercent(props.sensorData?.light)
  return value === null ? '--' : `${value}%`
})

const soilPercentText = computed(() => {
  const value = toPercent(props.sensorData?.soil)
  return value === null ? '--' : `${value}%`
})
</script>

<template>
  <div>
    <p><b>温度:</b> {{ props.sensorData?.temperature ?? '--' }} °C</p>
    <p><b>湿度:</b> {{ props.sensorData?.humidity ?? '--' }} %</p>
    <p><b>光照:</b> {{ lightPercentText }}</p>
    <p><b>土壤:</b> {{ soilPercentText }}</p>
  </div>
</template>

<style scoped>

</style>
