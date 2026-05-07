<template>
  <div class="box box-split-y">
    <div class="box-part glass-clear">
      <h2 class="mb-0">阈值读取与设置</h2>
      <p class="tag-2">读取 STM32 当前阈值，并从上位机下发新的阈值配置</p>
    </div>

    <div class="box-part glass-frost">
      <div class="style-action-group mb-4"></div>

      <div class="flex-x">
        <div class="flex-y">
          <div class="box mb-4">
            <h3 class="mb-0">当前阈值</h3>
            <div class="my-3">
              配置版本: {{ thresholdConfig?.configVersion ?? '--' }}<br>
              温度下限: {{ thresholdConfig?.tempLow ?? '--' }} °C<br>
              温度上限: {{ thresholdConfig?.tempHigh ?? '--' }} °C<br>
              光照下限: {{ thresholdConfig?.lightLow ?? '--' }}（{{
                formatReversePercent(thresholdConfig?.lightLow)
              }}）<br>
              光照上限: {{ thresholdConfig?.lightHigh ?? '--' }}（{{ formatReversePercent(thresholdConfig?.lightHigh) }}）<br>
              土壤下限: {{ thresholdConfig?.soilLow ?? '--' }}（{{ formatReversePercent(thresholdConfig?.soilLow) }}）<br>
              土壤上限: {{ thresholdConfig?.soilHigh ?? '--' }}（{{ formatReversePercent(thresholdConfig?.soilHigh) }}）
            </div>

            <button class="shadow m-2" @click="$emit('request-threshold')">
              读取阈值
            </button>
            <button class="shadow m-2" @click="fillFromCurrentThreshold">
              用当前阈值填充表单
            </button>
          </div>

          <div v-if="lastAck" class="box">
            <h3>下发结果</h3>
            <div>
              配置版本: {{ lastAck.configVersion ?? '--' }}<br>
              温度范围: {{ lastAck.tempLow ?? '--' }} ~ {{ lastAck.tempHigh ?? '--' }} °C<br>
              光照范围: {{ lastAck.lightLow ?? '--' }}（{{ formatReversePercent(lastAck?.lightLow) }}） ~
              {{ lastAck.lightHigh ?? '--' }}（{{ formatReversePercent(lastAck?.lightHigh) }}）<br>
              土壤范围: {{ lastAck.soilLow ?? '--' }}（{{ formatReversePercent(lastAck?.soilLow) }}） ~
              {{ lastAck.soilHigh ?? '--' }}（{{ formatReversePercent(lastAck?.soilHigh) }}）<br>
              <span :class="lastAck.success ? 'tag-correct my-3 shadow' : 'tag-warning my-3 shadow'">
                {{ lastAck.success ? '成功' : '失败' }}
              </span>
            </div>
          </div>
        </div>

        <div class="box mb-4">
          <div class="flex-x-center" style="justify-content: space-between; align-items: center; gap: 12px;">
            <h3>下发阈值表单</h3>
            <div v-if="isAiFilled" class="tag-correct mb-0">
              当前为 AI 推荐值
            </div>
          </div>

          <div class="left">
            <label>配置版本</label>
            <input
                v-model.number="form.configVersion"
                class="threshold-input"
                type="number"
                @input="markAsManualEdit"
            />

            <label>温度下限 (°C)</label>
            <input
                v-model.number="form.tempLow"
                class="threshold-input"
                type="number"
                @input="markAsManualEdit"
            />

            <label>温度上限 (°C)</label>
            <input
                v-model.number="form.tempHigh"
                class="threshold-input"
                type="number"
                @input="markAsManualEdit"
            />

            <label>光照下限 (%)</label>
            <input
                v-model.number="form.lightLow"
                class="threshold-input"
                max="100"
                min="0"
                type="number"
                @input="markAsManualEdit"
            />

            <label>光照上限 (%)</label>
            <input
                v-model.number="form.lightHigh"
                class="threshold-input"
                max="100"
                min="0"
                type="number"
                @input="markAsManualEdit"
            />

            <label>土壤下限 (%)</label>
            <input
                v-model.number="form.soilLow"
                class="threshold-input"
                max="100"
                min="0"
                type="number"
                @input="markAsManualEdit"
            />

            <label>土壤上限 (%)</label>
            <input
                v-model.number="form.soilHigh"
                class="threshold-input"
                max="100"
                min="0"
                type="number"
                @input="markAsManualEdit"
            />
          </div>

          <div class="mt-4">
            <button class="shadow m-2" @click="submitForm">
              {{ submitButtonText }}
            </button>
          </div>

          <p v-if="validationMessage" class="tag-3 mt-3">
            {{ validationMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, reactive, ref, watch} from 'vue'

const emit = defineEmits(['request-threshold', 'submit-threshold'])

const props = defineProps({
  thresholdConfig: {
    type: Object,
    default: null,
  },
  lastAck: {
    type: Object,
    default: null,
  },
  aiSuggestedThreshold: {
    type: Object,
    default: null,
  },
})

const RAW_MIN = 0
const RAW_MAX = 4095

const clampPercent = (value) => {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return 0
  return Math.min(100, Math.max(0, numberValue))
}

const reverseRawToPercent = (rawValue) => {
  const numberValue = Number(rawValue)
  if (rawValue == null || Number.isNaN(numberValue)) return null
  return Number((((RAW_MAX - numberValue) / (RAW_MAX - RAW_MIN)) * 100).toFixed(1))
}

const reversePercentToRaw = (percentValue) => {
  const percent = clampPercent(percentValue)
  return Math.round(RAW_MAX - (percent / 100) * (RAW_MAX - RAW_MIN))
}

const formatReversePercent = (rawValue) => {
  const percent = reverseRawToPercent(rawValue)
  return percent == null ? '--' : `${percent}%`
}

const normalizePercentRange = (a, b) => {
  const first = a == null ? 0 : a
  const second = b == null ? 0 : b
  return {
    low: Math.min(first, second),
    high: Math.max(first, second),
  }
}

const form = reactive({
  configVersion: 1,
  tempLow: 18,
  tempHigh: 30,
  lightLow: 0,
  lightHigh: 100,
  soilLow: 0,
  soilHigh: 100,
})

const isAiFilled = ref(false)

const assignFormFromThreshold = (value) => {
  if (!value) return

  const lightPercentA = reverseRawToPercent(value.lightLow ?? 200)
  const lightPercentB = reverseRawToPercent(value.lightHigh ?? 1500)
  const soilPercentA = reverseRawToPercent(value.soilLow ?? 1200)
  const soilPercentB = reverseRawToPercent(value.soilHigh ?? 2600)

  const lightRange = normalizePercentRange(lightPercentA, lightPercentB)
  const soilRange = normalizePercentRange(soilPercentA, soilPercentB)

  form.configVersion = value.configVersion ?? 1
  form.tempLow = value.tempLow ?? 18
  form.tempHigh = value.tempHigh ?? 30
  form.lightLow = lightRange.low
  form.lightHigh = lightRange.high
  form.soilLow = soilRange.low
  form.soilHigh = soilRange.high
}

const assignFormFromAiSuggestion = (value) => {
  if (!value) return

  form.configVersion = value.configVersion ?? 1
  form.tempLow = value.tempLow ?? 18
  form.tempHigh = value.tempHigh ?? 30
  form.lightLow = clampPercent(value.lightLow ?? 30)
  form.lightHigh = clampPercent(value.lightHigh ?? 70)
  form.soilLow = clampPercent(value.soilLow ?? 40)
  form.soilHigh = clampPercent(value.soilHigh ?? 75)
  isAiFilled.value = true
}

watch(
    () => props.thresholdConfig,
    (value) => {
      assignFormFromThreshold(value)
    },
    {immediate: true}
)

watch(
    () => props.aiSuggestedThreshold,
    (value) => {
      assignFormFromAiSuggestion(value)
    },
    {immediate: true}
)

const validationMessage = computed(() => {
  if (form.tempLow > form.tempHigh) return '温度下限不能大于上限'
  if (form.lightLow > form.lightHigh) return '光照下限不能大于上限'
  if (form.soilLow > form.soilHigh) return '土壤下限不能大于上限'
  if (form.lightLow < 0 || form.lightHigh > 100) return '光照阈值必须在 0 ~ 100 之间'
  if (form.soilLow < 0 || form.soilHigh > 100) return '土壤阈值必须在 0 ~ 100 之间'
  return ''
})

const submitButtonText = computed(() => {
  return isAiFilled.value ? '发送AI设定的阈值' : '发送阈值到 STM32'
})

const markAsManualEdit = () => {
  isAiFilled.value = false
}

const fillFromCurrentThreshold = () => {
  assignFormFromThreshold(props.thresholdConfig)
  isAiFilled.value = false
}

const submitForm = () => {
  if (validationMessage.value) return

  const lightRawLowCandidate = reversePercentToRaw(form.lightLow)
  const lightRawHighCandidate = reversePercentToRaw(form.lightHigh)
  const soilRawLowCandidate = reversePercentToRaw(form.soilLow)
  const soilRawHighCandidate = reversePercentToRaw(form.soilHigh)

  emit('submit-threshold', {
    configVersion: form.configVersion,
    tempLow: form.tempLow,
    tempHigh: form.tempHigh,
    lightLow: Math.min(lightRawLowCandidate, lightRawHighCandidate),
    lightHigh: Math.max(lightRawLowCandidate, lightRawHighCandidate),
    soilLow: Math.min(soilRawLowCandidate, soilRawHighCandidate),
    soilHigh: Math.max(soilRawLowCandidate, soilRawHighCandidate),
  })

  isAiFilled.value = false
}
</script>
