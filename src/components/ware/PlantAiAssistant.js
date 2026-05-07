import {ref} from 'vue'

const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3'
const DEFAULT_API_KEY = 'sk-gyeamlvczxflazulsdjrbnfymmrigwauquejitgqekvhnrdm'
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

const clamp = (value, min, max) => {
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) return min
    return Math.min(max, Math.max(min, numberValue))
}

const normalizeThresholds = (thresholds = {}) => {
    const rawTempLow = Number(thresholds.tempLow ?? 18)
    const rawTempHigh = Number(thresholds.tempHigh ?? 30)

    const tempLow = Math.min(rawTempLow, rawTempHigh)
    const tempHigh = Math.max(rawTempLow, rawTempHigh)

    const rawLightLow = clamp(thresholds.lightLow ?? 30, 0, 100)
    const rawLightHigh = clamp(thresholds.lightHigh ?? 70, 0, 100)
    const lightLow = Math.min(rawLightLow, rawLightHigh)
    const lightHigh = Math.max(rawLightLow, rawLightHigh)

    const rawSoilLow = clamp(thresholds.soilLow ?? 40, 0, 100)
    const rawSoilHigh = clamp(thresholds.soilHigh ?? 75, 0, 100)
    const soilLow = Math.min(rawSoilLow, rawSoilHigh)
    const soilHigh = Math.max(rawSoilLow, rawSoilHigh)

    return {
        configVersion: Number(thresholds.configVersion ?? 1),
        tempLow,
        tempHigh,
        lightLow,
        lightHigh,
        soilLow,
        soilHigh,
    }
}

const normalizeCareInfo = (careInfo = {}) => {
    return {
        summary: typeof careInfo.summary === 'string' ? careInfo.summary.trim() : '',
        features: Array.isArray(careInfo.features)
            ? careInfo.features.filter((item) => typeof item === 'string' && item.trim())
            : [],
        careTips: Array.isArray(careInfo.careTips)
            ? careInfo.careTips.filter((item) => typeof item === 'string' && item.trim())
            : [],
        warning: typeof careInfo.warning === 'string' ? careInfo.warning.trim() : '',
    }
}

const extractJsonFromText = (text) => {
    if (!text || typeof text !== 'string') {
        throw new Error('模型返回内容为空')
    }

    const cleanText = text.trim()

    try {
        return JSON.parse(cleanText)
    } catch {
        const match = cleanText.match(/\{[\s\S]*\}/)
        if (!match) {
            throw new Error('未能从模型返回中提取 JSON')
        }
        return JSON.parse(match[0])
    }
}

const buildPrompt = (plantName) => {
    return `
你是一个盆栽植物养护系统的 AI 助手。
用户会输入一种植物名称，你需要返回适合家庭盆栽环境的推荐阈值和简要养护科普。

你必须严格只返回 JSON，不要返回 markdown，不要返回解释，不要返回额外文字。

返回格式必须是：
{
  "plantName": "植物名称",
  "thresholds": {
    "configVersion": 1,
    "tempLow": 0,
    "tempHigh": 0,
    "lightLow": 0,
    "lightHigh": 0,
    "soilLow": 0,
    "soilHigh": 0
  },
  "careInfo": {
    "summary": "一句话简介",
    "features": ["特点1", "特点2", "特点3"],
    "careTips": ["建议1", "建议2", "建议3", "建议4"],
    "warning": "注意事项"
  }
}

规则：
1. 所有字段必须存在
2. tempLow 和 tempHigh 单位为摄氏度
3. lightLow 和 lightHigh 范围必须在 0 到 100，表示光照百分比
4. soilLow 和 soilHigh 范围必须在 0 到 100，表示土壤湿度百分比
5. low 不能大于 high
6. configVersion 固定为 1
7. 文本全部使用中文
8. 阈值应适用于普通家庭盆栽养护场景
9. 输出的文字有韵律有美感，不宜过短，至少有一处断句
10. 性格活泼，喜欢使用感叹号！

植物名称：${plantName}
`.trim()
}

export function usePlantAiAssistant(options = {}) {
    const apiKey = ref(options.apiKey ?? DEFAULT_API_KEY)
    const model = ref(options.model ?? DEFAULT_MODEL)

    const loading = ref(false)
    const error = ref('')
    const rawResponse = ref(null)
    const plantName = ref('')
    const thresholds = ref(null)
    const careInfo = ref(null)

    const setApiKey = (value) => {
        apiKey.value = value ?? DEFAULT_API_KEY
    }

    const setModel = (value) => {
        model.value = value || DEFAULT_MODEL
    }

    const clearResult = () => {
        rawResponse.value = null
        plantName.value = ''
        thresholds.value = null
        careInfo.value = null
        error.value = ''
    }

    const generate = async (inputPlantName) => {
        const finalPlantName = String(inputPlantName ?? '').trim()

        if (!finalPlantName) {
            throw new Error('植物名称不能为空')
        }

        if (!apiKey.value) {
            throw new Error('API Key 未配置')
        }

        loading.value = true
        error.value = ''

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey.value}`,
                },
                body: JSON.stringify({
                    model: model.value,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个有用的植物养护助手，必须严格按 JSON 输出结果。',
                        },
                        {
                            role: 'user',
                            content: buildPrompt(finalPlantName),
                        },
                    ],
                    temperature: 0.4,
                }),
            })

            const data = await response.json()
            const serverMessage =
                data?.error?.message ||
                data?.message ||
                data?.msg ||
                ''

            if (!response.ok) {
                if (serverMessage.includes('Model does not exist')) {
                    throw new Error(`模型不存在或不可用：${model.value}`)
                }

                if (
                    serverMessage.includes('account balance is insufficient') ||
                    serverMessage.includes('insufficient balance') ||
                    serverMessage.includes('quota')
                ) {
                    throw new Error('AI 服务账户余额不足或额度不足，请检查账户状态')
                }

                if (
                    serverMessage.includes('Invalid API key') ||
                    serverMessage.includes('Unauthorized') ||
                    response.status === 401
                ) {
                    throw new Error('API Key 无效或已失效')
                }

                throw new Error(serverMessage || 'AI 请求失败')
            }

            const content = data?.choices?.[0]?.message?.content
            const parsed = extractJsonFromText(content)

            const nextPlantName =
                typeof parsed.plantName === 'string' && parsed.plantName.trim()
                    ? parsed.plantName.trim()
                    : finalPlantName

            const nextThresholds = normalizeThresholds(parsed.thresholds)
            const nextCareInfo = normalizeCareInfo(parsed.careInfo)

            rawResponse.value = data
            plantName.value = nextPlantName
            thresholds.value = nextThresholds
            careInfo.value = nextCareInfo

            return {
                plantName: nextPlantName,
                thresholds: nextThresholds,
                careInfo: nextCareInfo,
                rawResponse: data,
            }
        } catch (requestError) {
            error.value = requestError?.message || '生成失败'
            throw requestError
        } finally {
            loading.value = false
        }
    }

    return {
        apiKey,
        model,
        loading,
        error,
        rawResponse,
        plantName,
        thresholds,
        careInfo,
        setApiKey,
        setModel,
        clearResult,
        generate,
    }
}
