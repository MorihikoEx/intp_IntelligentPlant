<template>
  <section>
    <div class="box box-split-x">
      <button class="pl-2" @click="$emit('go-home')">
        <i class="bi bi-chevron-left"></i>
        返回
      </button>
    </div>

    <div class="box box-split-y">
      <div class="box-part glass-clear">
        <h1 class="mb-0">智能仪表盘</h1>
        <h2 class="tag-2">smart dashboard</h2>
        <p>
          用于展示 STM32 设备当前上传的环境数据、连接状态与阈值配置。
        </p>
      </div>

      <div class="box-part glass-frost">
        <div class="box mx-5 my-0 px-5">
          <microcontroller-status :is-connected="isConnected"/>
        </div>

        <div class="box flex-x-center gap-6 mt-0 pt-0">
          <TemperatureGauge :value="sensorData?.temperature ?? null"/>
          <HumidityGauge :value="sensorData?.humidity ?? null"/>
        </div>
      </div>
    </div>

    <div class="box box-split-y">
      <div class="box-part glass-clear">
        <h2 class="mb-0">传感器数据趋势图</h2>
        <p class="tag-2">直观展示温湿度、土壤湿度和光照强度的变化趋势</p>
      </div>
      <div class="box-part glass-frost pb-5 mb-5">
        <h2 class="mb-0">温湿度折线图</h2>
        <time-line-chart
            :data="historyData"
            :series="[
            { key: 'temperature', label: '温度', color: 'var(--color-d)' },
            { key: 'humidity', label: '湿度', color: 'var(--color-a)' }
          ]"
        />
        <h2 class="mb-0">光照强度折线图</h2>
        <time-line-chart
            :data="historyData"
            :series="[
            { key: 'light', label: '光照强度', color: 'var(--color-d)' }
          ]"
        />
        <h2 class="mb-0">土壤湿度折线图</h2>
        <time-line-chart
            :data="historyData"
            :series="[
            { key: 'soil', label: '土壤湿度', color: 'var(--color-a)' }
          ]"
        />
      </div>
    </div>


    <plant-care-info-panel
        @thresholds-generated="handleThresholdsGenerated"
    />

    <threshold-control-panel
        :ai-suggested-threshold="aiSuggestedThreshold"
        :last-ack="lastAck"
        :threshold-config="thresholdConfig"
        class="mb-5"
        @request-threshold="$emit('request-threshold')"
        @submit-threshold="$emit('submit-threshold', $event)"
    />

    <div class="box box-split-y">
      <div class="box-part glass-clear">
        <h2 class="mb-0">原始数据面板</h2>
        <p class="tag-2">用于调试 TCP / WebSocket 数据</p>
      </div>
      <div class="box-part glass-frost">
        <div class="mb-5 tag-disabled fill">
          温度: {{ sensorData?.temperature ?? '--' }} °C<br>
          湿度: {{ sensorData?.humidity ?? '--' }} %<br>
          光照原始值: {{ sensorData?.light ?? '--' }}<br>
          光照显示值: {{ lightPercentText }}<br>
          土壤原始值: {{ sensorData?.soil ?? '--' }}<br>
          土壤显示值: {{ soilPercentText }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import {computed, ref} from 'vue'
import TemperatureGauge from '@/components/ware/TemperatureGauge.vue'
import HumidityGauge from '@/components/ware/HumidityGauge.vue'
import MicrocontrollerStatus from '@/components/ware/MicrocontrollerStatus.vue'
import ThresholdControlPanel from '@/components/ware/ThresholdControlPanel.vue'
import PlantCareInfoPanel from '@/components/ware/PlantCareInfoPanel.vue'
import TimeLineChart from '@/components/ware/TimeLineChart.vue'

defineEmits(['go-home', 'request-threshold', 'submit-threshold'])

const props = defineProps({
  isConnected: {
    type: Boolean,
    default: false,
  },
  sensorData: {
    type: Object,
    default: null,
  },
  thresholdConfig: {
    type: Object,
    default: null,
  },
  lastAck: {
    type: Object,
    default: null,
  },
  historyData: {
    type: Array,
    default: () => [],
  },
})

const aiSuggestedThreshold = ref(null)

const handleThresholdsGenerated = (thresholds) => {
  aiSuggestedThreshold.value = thresholds
}

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
