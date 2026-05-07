<script setup>
import CircularGauge from './CircularGauge.vue'

defineProps({
  value: {
    type: [Number, String],
    default: null,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 50,
  },
})
</script>

<template>
  <CircularGauge
      :max="max"
      :min="min"
      :value="value"
      color="--color-d-hover"
      title="温度"
      unit="°C"
  />
</template>
