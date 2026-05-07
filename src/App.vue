<template>
  <background/>
  <main>
    <a href="https://www.st.com.cn/content/st_com/zh.html">
      <img alt="st-logo" class="logo center pb-0" src="../public/img/st-logo.svg"/>
    </a>

    <section v-if="currentView === 'home'">
      <div class="box box-split-y">
        <div class="box-part glass-clear py-5">
          <h1 class="mb-0">基于STM32的智能植物养殖设计</h1>
          <h2 class="tag-1 mb-5"> &nbsp; 青岛科技大学本科毕业设计（论文）</h2>
        </div>
        <div class="box-part glass-frost py-5">
          <h2>Intelligent Plant Cultivation Design Based on STM32</h2>
          <p>
            本系统是基于STM32的智能植物养护系统，用于实现对特定植物养护流程的精细化控制。<br>
            传感器对绿植进行全方位的实时监测，根据检测到的数据，系统自动判断是否进行浇水、降温排风、遮光以及补光照射。
          </p>
          <div class="style-action-group">
            <button class="shadow m-2" @click="goToDashboard">
              仪表盘
            </button>
            <button class="shadow m-2" @click="goToStyleTest">
              样式测试页
            </button>
          </div>
        </div>
      </div>

      <div class="flex-x">
        <div class="box glass-frost grow-1">
          <h2>单片机状态</h2>
          <microcontroller-status :is-connected="isConnected"/>
        </div>

        <div class="box glass-frost grow-3">
          <data-display :sensor-data="sensorData"/>
        </div>
      </div>
    </section>

    <style-test-page
        v-else-if="currentView === 'style-test'"
        @go-home="goHome"
    />

    <dashboard-page
        v-else-if="currentView === 'dashboard'"
        :history-data="historyData"
        :is-connected="isConnected"
        :last-ack="lastAck"
        :sensor-data="sensorData"
        :threshold-config="thresholdConfig"
        @go-home="goHome"
        @request-threshold="requestThreshold"
        @submit-threshold="submitThreshold"
    />
  </main>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue'
import Background from './components/ware/Background.vue'
import DashboardPage from './components/DashboardPage.vue'
import MicrocontrollerStatus from './components/ware/MicrocontrollerStatus.vue'
import DataDisplay from '@/components/ware/DataDisplay.vue'
import StyleTestPage from './components/StyleTestPage.vue'

const isConnected = ref(false)
const sensorData = ref(null)
const historyData = ref([])
const thresholdConfig = ref(null)
const lastAck = ref(null)
const currentView = ref('home')

const HISTORY_LIMIT = 500

let ws = null

const goToDashboard = () => {
  currentView.value = 'dashboard'
}

const goToStyleTest = () => {
  currentView.value = 'style-test'
}

const goHome = () => {
  currentView.value = 'home'
}

const normalizeSensorData = (msg) => {
  return {
    temperature: msg.temperature ?? null,
    humidity: msg.humidity ?? null,
    light: msg.light ?? null,
    soil: msg.soil ?? null,
    timestamp: msg.timestamp ?? null,
  }
}

const normalizeThresholdConfig = (msg) => {
  return {
    configVersion: msg.configVersion ?? 1,
    tempLow: msg.tempLow ?? 18,
    tempHigh: msg.tempHigh ?? 30,
    lightLow: msg.lightLow ?? 200,
    lightHigh: msg.lightHigh ?? 1500,
    soilLow: msg.soilLow ?? 1200,
    soilHigh: msg.soilHigh ?? 2600,
  }
}

const mergeHistory = (items) => {
  const normalized = items
      .map(normalizeSensorData)
      .filter(item => item.timestamp)

  const map = new Map(
      historyData.value.map(item => [item.timestamp, item])
  )

  normalized.forEach(item => {
    map.set(item.timestamp, item)
  })

  historyData.value = [...map.values()]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-HISTORY_LIMIT)
}

const pushHistory = (item) => {
  if (!item?.timestamp) {
    return
  }

  mergeHistory([item])
}

const loadHistory = async () => {
  try {
    const response = await fetch('/sensor_history.json')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const list = await response.json()

    if (!Array.isArray(list)) {
      throw new Error('历史数据格式错误')
    }

    mergeHistory(list)
  } catch (error) {
    console.error('读取历史数据失败:', error)
  }
}

const sendWsMessage = (payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket 未连接，发送失败:', payload)
    return false
  }

  ws.send(JSON.stringify(payload))
  return true
}

const requestThreshold = () => {
  sendWsMessage({type: 'get_threshold'})
}

const submitThreshold = (config) => {
  sendWsMessage({
    type: 'set_threshold',
    configVersion: Number(config.configVersion),
    tempLow: Number(config.tempLow),
    tempHigh: Number(config.tempHigh),
    lightLow: Number(config.lightLow),
    lightHigh: Number(config.lightHigh),
    soilLow: Number(config.soilLow),
    soilHigh: Number(config.soilHigh),
  })
}

onMounted(async () => {
  await loadHistory()

  ws = new WebSocket('ws://localhost:8081')

  ws.onopen = () => {
    console.log('WebSocket 已连接')
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)

      if (msg.type === 'status') {
        isConnected.value = !!msg.isOnline

        if (!msg.isOnline) {
          sensorData.value = null
        }

        return
      }

      if (msg.type === 'telemetry') {
        const normalized = normalizeSensorData(msg)
        sensorData.value = normalized
        pushHistory(normalized)
        return
      }

      if (msg.type === 'threshold') {
        thresholdConfig.value = normalizeThresholdConfig(msg)
        return
      }

      if (msg.type === 'set_threshold_ack') {
        lastAck.value = {
          success: !!msg.success,
          ...normalizeThresholdConfig(msg),
          time: Date.now(),
        }

        if (msg.success) {
          thresholdConfig.value = normalizeThresholdConfig(msg)
        }

        return
      }

      if (msg.type === 'error') {
        console.error('服务端错误:', msg.message)
      }
    } catch (e) {
      console.error('数据解析失败:', event.data)
    }
  }

  ws.onclose = () => {
    isConnected.value = false
    sensorData.value = null
    console.log('WebSocket 已断开')
  }

  ws.onerror = (err) => {
    console.error('WebSocket 发生错误:', err)
  }
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>
