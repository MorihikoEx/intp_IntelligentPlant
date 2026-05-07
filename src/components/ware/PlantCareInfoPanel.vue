<template>
  <div class="box box-split-y">
    <div class="box-part glass-clear">
      <h2 class="mb-0">AI植物科普与建议</h2>
      <p class="tag-2">竟然只是输入植物名字就行了吗！</p>
    </div>
    <div class="box-part glass-frost">
      <div class="box my-0">
        <div class="left my-3">
          <label>植物名称</label>
          <input
              v-model.trim="inputPlantName"
              class="threshold-input"
              placeholder="例如：发财树、绿萝、多肉"
              type="text"
              @keyup.enter="handleGenerate"
          />
        </div>

        <div class="style-action-group mt-4">
          <button :disabled="loading" class="shadow m-2" @click="handleGenerate">
            {{ loading ? 'AI 生成中...' : '生成养护建议！' }}
          </button>
        </div>

        <p v-if="errorText" class="tag-error">
          [error!] {{ errorText }}
        </p>
      </div>
    </div>
  </div>

  <div class="box glass-frost">
    <div class="box left my-0 pb-0">
      <h1 class="mb-0">{{ displayPlantName }}</h1>
      <p class="tag-2">{{ displayCareInfo.summary || '--' }}</p>
    </div>
    <div class="box mt-0">
      <div class="left">
        <h2>植物特点</h2>
        <ul v-if="displayCareInfo.features.length">
          <li v-for="(item, index) in displayCareInfo.features" :key="`feature-${index}`">
            {{ item }}
          </li>
        </ul>
        <p v-else>--</p>
      </div>

      <div class="left">
        <h2>养护方法</h2>
        <ul v-if="displayCareInfo.careTips.length">
          <li v-for="(item, index) in displayCareInfo.careTips" :key="`care-${index}`">
            {{ item }}
          </li>
        </ul>
        <p v-else>--</p>
      </div>

      <div class="left">
        <h2>注意事项</h2>
        <ul v-if="displayCareInfo.warning">
          <li>{{ displayCareInfo.warning }}</li>
        </ul>
        <p v-else>--</p>
      </div>
    </div>


  </div>

</template>

<script setup>
import {computed, ref} from 'vue'
import {usePlantAiAssistant} from '@/components/ware/PlantAiAssistant.js'

const emit = defineEmits(['thresholds-generated', 'care-info-generated'])

const DEFAULT_PLANT_NAME = '发财树'
const DEFAULT_CARE_INFO = {
  summary: '发财树是常见的室内观叶盆栽，株型美观，寓意吉祥，适合摆放在客厅、书房等家庭环境中。',
  features: [
    '叶色常绿，观赏性较强',
    '适应室内环境能力较好',
    '耐阴性较好，但也需要一定散射光',
  ],
  careTips: [
    '放在明亮散射光处养护，避免长时间暴晒',
    '土壤保持微湿即可，避免积水烂根',
    '生长期可适当通风，促进叶片状态稳定',
    '冬季注意保暖，避免低温冻伤',
  ],
  warning: '发财树怕积水，浇水过多黄叶烂根。',
}

const inputPlantName = ref(DEFAULT_PLANT_NAME)
const currentPlantName = ref(DEFAULT_PLANT_NAME)
const currentCareInfo = ref({...DEFAULT_CARE_INFO})
const errorText = ref('')

const ai = usePlantAiAssistant({
  model: 'deepseek-ai/DeepSeek-V3',
})

const loading = computed(() => ai.loading.value)

const displayPlantName = computed(() => currentPlantName.value || DEFAULT_PLANT_NAME)
const displayCareInfo = computed(() => currentCareInfo.value || DEFAULT_CARE_INFO)

const handleGenerate = async () => {
  errorText.value = ''

  try {
    const result = await ai.generate(inputPlantName.value)

    currentPlantName.value = result.plantName
    currentCareInfo.value = result.careInfo

    emit('thresholds-generated', result.thresholds)
    emit('care-info-generated', {
      plantName: result.plantName,
      careInfo: result.careInfo,
    })
  } catch (error) {
    errorText.value = error?.message || '生成失败，请稍后重试'
  }
}
</script>
