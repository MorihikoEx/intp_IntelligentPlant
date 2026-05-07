<template>
  <div class="timeline-chart">
    <svg :height="height" :viewBox="`0 0 ${width} ${height}`" width="100%">
      <g>
        <line
            :x1="padding.left"
            :x2="padding.left"
            :y1="padding.top"
            :y2="height - padding.bottom"
            stroke="currentColor"
        />
        <line
            :x1="padding.left"
            :x2="width - padding.right"
            :y1="height - padding.bottom"
            :y2="height - padding.bottom"
            stroke="currentColor"
        />
      </g>

      <g v-for="tick in yTicks" :key="`y-${tick.value}`">
        <line
            :x1="padding.left"
            :x2="width - padding.right"
            :y1="tick.y"
            :y2="tick.y"
            opacity="0.12"
            stroke="currentColor"
        />
        <text
            :x="padding.left - 8"
            :y="tick.y + 4"
            fill="currentColor"
            font-size="12"
            text-anchor="end"
        >
          {{ tick.label }}
        </text>
      </g>

      <g v-for="tick in xTicks" :key="`x-${tick.timestamp}`">
        <line
            :x1="tick.x"
            :x2="tick.x"
            :y1="padding.top"
            :y2="height - padding.bottom"
            opacity="0.08"
            stroke="currentColor"
        />
        <text
            :x="tick.x"
            :y="height - padding.bottom + 18"
            fill="currentColor"
            font-size="12"
            text-anchor="middle"
        >
          {{ tick.label }}
        </text>
      </g>

      <g v-for="series in normalizedSeries" :key="series.key">
        <path
            :d="buildPath(series)"
            :stroke="series.color"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
        />
      </g>
    </svg>

    <div class="legend">
      <span
          v-for="series in normalizedSeries"
          :key="series.key"
          class="legend-item"
      >
        <i
            :style="{ backgroundColor: series.color }"
            class="legend-color"
        ></i>
        {{ series.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  series: {
    type: Array,
    default: () => [],
  },
  width: {
    type: Number,
    default: 760,
  },
  height: {
    type: Number,
    default: 320,
  },
})

const padding = {
  top: 20,
  right: 20,
  bottom: 36,
  left: 46,
}

const normalizedData = computed(() => {
  return [...props.data]
      .filter(item => item && item.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp)
})

const normalizedSeries = computed(() => {
  return props.series.map((item, index) => ({
    key: item.key,
    label: item.label ?? item.key,
    color: item.color ?? ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'][index % 4],
  }))
})

const allValues = computed(() => {
  return normalizedData.value.flatMap(row =>
      normalizedSeries.value
          .map(item => Number(row[item.key]))
          .filter(value => Number.isFinite(value))
  )
})

const timeRange = computed(() => {
  const list = normalizedData.value
  if (!list.length) {
    return {
      min: Date.now(),
      max: Date.now() + 1,
      span: 1,
    }
  }

  const min = list[0].timestamp
  const max = list[list.length - 1].timestamp
  const span = Math.max(max - min, 1)

  return {min, max, span}
})

const valueRange = computed(() => {
  const values = allValues.value

  if (!values.length) {
    return {min: 0, max: 100, span: 100}
  }

  let min = Math.min(...values)
  let max = Math.max(...values)

  if (min === max) {
    min -= 1
    max += 1
  }

  const rawSpan = max - min
  const paddingValue = Math.max(rawSpan * 0.1, 1)

  min -= paddingValue
  max += paddingValue

  return {
    min,
    max,
    span: max - min,
  }
})

const chartWidth = computed(() => props.width - padding.left - padding.right)
const chartHeight = computed(() => props.height - padding.top - padding.bottom)

const xScale = (timestamp) => {
  const {min, span} = timeRange.value
  return padding.left + ((timestamp - min) / span) * chartWidth.value
}

const yScale = (value) => {
  const {min, span} = valueRange.value
  return padding.top + (1 - (value - min) / span) * chartHeight.value
}

const formatNumber = (value) => {
  const abs = Math.abs(value)
  if (abs >= 100) return Math.round(value)
  if (abs >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

const yTicks = computed(() => {
  const count = 5
  const {min, max, span} = valueRange.value
  const step = span / (count - 1)

  return Array.from({length: count}, (_, i) => {
    const value = max - i * step
    return {
      value,
      y: yScale(value),
      label: formatNumber(value),
    }
  })
})

const formatTimeLabel = (timestamp, showDate) => {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return showDate ? `${month}/${day}` : `${hour}:${minute}`
}

const xTicks = computed(() => {
  const list = normalizedData.value
  if (!list.length) return []

  const maxTickCount = 6
  const step = Math.max(1, Math.ceil(list.length / maxTickCount))
  const showDate = timeRange.value.span > 24 * 60 * 60 * 1000

  const ticks = list
      .filter((_, index) => index % step === 0)
      .map(item => ({
        timestamp: item.timestamp,
        x: xScale(item.timestamp),
        label: formatTimeLabel(item.timestamp, showDate),
      }))

  const last = list[list.length - 1]
  const hasLast = ticks.some(item => item.timestamp === last.timestamp)

  if (!hasLast) {
    ticks.push({
      timestamp: last.timestamp,
      x: xScale(last.timestamp),
      label: formatTimeLabel(last.timestamp, showDate),
    })
  }

  return ticks
})

const buildPath = (series) => {
  const points = normalizedData.value
      .filter(item => Number.isFinite(Number(item[series.key])))
      .map(item => ({
        x: xScale(item.timestamp),
        y: yScale(Number(item[series.key])),
      }))

  if (!points.length) return ''

  return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')
}
</script>

<style scoped>
.timeline-chart {
  width: 100%;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 14px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 20px;
  height: 20px;
  display: inline-block;
  border-radius: 50%;
}
</style>
