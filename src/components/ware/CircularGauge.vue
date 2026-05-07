<script setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '仪表',
  },
  value: {
    type: [Number, String],
    default: null,
  },
  unit: {
    type: String,
    default: '',
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  color: {
    type: String,
    default: '--color-a-bg',
  },
})

const numericValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return null
  }

  const num = Number(props.value)
  return Number.isFinite(num) ? num : null
})

const animatedValue = ref(null)
let animationFrameId = null

const stopAnimation = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const animateTo = (target) => {
  stopAnimation()

  if (target === null) {
    animatedValue.value = null
    return
  }

  if (animatedValue.value === null || !Number.isFinite(animatedValue.value)) {
    animatedValue.value = target
    return
  }

  const step = () => {
    const current = animatedValue.value ?? target
    const delta = target - current

    if (Math.abs(delta) < 0.05) {
      animatedValue.value = target
      animationFrameId = null
      return
    }

    animatedValue.value = current + delta * 0.12
    animationFrameId = requestAnimationFrame(step)
  }

  animationFrameId = requestAnimationFrame(step)
}

watch(
    numericValue,
    (newValue) => {
      animateTo(newValue)
    },
    {immediate: true}
)

onBeforeUnmount(() => {
  stopAnimation()
})

const safeValue = computed(() => {
  if (animatedValue.value === null) {
    return null
  }
  return Math.min(props.max, Math.max(props.min, animatedValue.value))
})

const percent = computed(() => {
  if (animatedValue.value === null) {
    return 0
  }

  if (props.max <= props.min) {
    return 0
  }

  return ((safeValue.value - props.min) / (props.max - props.min)) * 100
})

const displayValue = computed(() => {
  if (animatedValue.value === null) {
    return '--'
  }
  return String(Math.round(animatedValue.value))
})

const resolvedColor = computed(() => {
  if (!props.color) {
    return 'var(--color-a)'
  }

  if (props.color.startsWith('--')) {
    return `var(${props.color})`
  }

  return props.color
})

const ringStyle = computed(() => ({
  '--gauge-color': resolvedColor.value,
  '--gauge-value': `${percent.value}%`,
}))
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <div :style="ringStyle" class="simple-gauge-ring shadow">
      <div class="simple-gauge-center">
        <h1 class="my-0">{{ displayValue }}</h1>
        <p class="my-0">{{ unit }}</p>
      </div>
    </div>

    <div class="simple-gauge-range">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>
