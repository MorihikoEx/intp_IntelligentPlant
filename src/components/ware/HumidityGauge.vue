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
    default: 100,
  },
})
</script>

<template>
  <CircularGauge
      :max="max"
      :min="min"
      :value="value"
      color="--color-a-hover"
      title="湿度"
      unit="%"
  />
</template>
