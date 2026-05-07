import net from 'net'
import {WebSocketServer} from 'ws'
import fs from 'fs/promises'
import path from 'path'

const HISTORY_FILE = path.resolve(process.cwd(), 'sensor_history.json')
const MAX_HISTORY = 100
const TIMEOUT_MS = 15000

export default function tcpBridgePlugin() {
    let wss
    let tcpServer
    let clients = []
    let latestData = null
    let latestThreshold = null
    let historyData = []
    let heartbeatTimer = null
    let deviceOnline = false
    let activeSocket = null

    const broadcast = (obj) => {
        const msg = JSON.stringify(obj)
        clients.forEach(c => {
            if (c.readyState === 1) {
                c.send(msg)
            }
        })
    }

    const broadcastStatus = (isOnline) => {
        deviceOnline = isOnline
        broadcast({type: 'status', isOnline})
    }

    const broadcastData = (data) => {
        broadcast({type: 'data', ...data})
    }

    const broadcastThreshold = (data) => {
        latestThreshold = data
        broadcast({type: 'threshold', ...data})
    }

    const broadcastThresholdAck = (data) => {
        if (data.success) {
            latestThreshold = {
                type: 'threshold',
                configVersion: data.configVersion,
                tempLow: data.tempLow,
                tempHigh: data.tempHigh,
                lightLow: data.lightLow,
                lightHigh: data.lightHigh,
                soilLow: data.soilLow,
                soilHigh: data.soilHigh,
            }
        }
        broadcast({type: 'set_threshold_ack', ...data})
    }

    const sendToDevice = (obj) => {
        if (!activeSocket || activeSocket.destroyed) {
            return false
        }

        const line = `${JSON.stringify(obj)}\n`
        activeSocket.write(line)
        console.log('[WS->TCP]', line.trim())
        return true
    }

    return {
        name: 'tcp-bridge-plugin',
        async configureServer(server) {
            try {
                const fileContent = await fs.readFile(HISTORY_FILE, 'utf-8')
                historyData = JSON.parse(fileContent)
                if (!Array.isArray(historyData)) historyData = []
            } catch (e) {
                historyData = []
            }

            wss = new WebSocketServer({port: 8081})
            wss.on('connection', (ws) => {
                console.log('[WS] 应用已连接')
                clients.push(ws)

                ws.send(JSON.stringify({type: 'status', isOnline: deviceOnline}))

                if (latestData) {
                    ws.send(JSON.stringify({type: 'data', ...latestData}))
                }

                if (latestThreshold) {
                    ws.send(JSON.stringify({type: 'threshold', ...latestThreshold}))
                }

                ws.on('message', (raw) => {
                    try {
                        const msg = JSON.parse(raw.toString())

                        if (msg.type === 'get_threshold') {
                            const ok = sendToDevice({type: 'get_threshold'})
                            if (!ok) {
                                ws.send(JSON.stringify({
                                    type: 'error',
                                    message: '设备未连接，无法读取阈值'
                                }))
                            }
                            return
                        }

                        if (msg.type === 'set_threshold') {
                            const payload = {
                                type: 'set_threshold',
                                configVersion: Number(msg.configVersion ?? 1),
                                tempLow: Number(msg.tempLow),
                                tempHigh: Number(msg.tempHigh),
                                lightLow: Number(msg.lightLow),
                                lightHigh: Number(msg.lightHigh),
                                soilLow: Number(msg.soilLow),
                                soilHigh: Number(msg.soilHigh),
                            }

                            const ok = sendToDevice(payload)
                            if (!ok) {
                                ws.send(JSON.stringify({
                                    type: 'error',
                                    message: '设备未连接，无法下发阈值'
                                }))
                            }
                            return
                        }
                    } catch (err) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'WebSocket 消息格式错误'
                        }))
                    }
                })

                ws.on('close', () => {
                    clients = clients.filter(c => c !== ws)
                })
            })

            server.middlewares.use('/api/history', (req, res) => {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(historyData))
            })

            tcpServer = net.createServer((socket) => {
                console.log('\x1b[32m%s\x1b[0m', '[TCP] 设备已连接')
                let buffer = ''
                let lastAliveTime = Date.now()

                activeSocket = socket
                broadcastStatus(true)

                heartbeatTimer = setInterval(() => {
                    if (Date.now() - lastAliveTime > TIMEOUT_MS) {
                        console.log('[TCP][timeout] 超时未收到任何数据，主动断开')
                        broadcastStatus(false)
                        socket.destroy()
                    }
                }, 1000)

                socket.on('data', (data) => {
                    console.log('[TCP][raw]', JSON.stringify(data.toString()))
                    lastAliveTime = Date.now()

                    if (!deviceOnline) {
                        broadcastStatus(true)
                    }

                    buffer += data.toString()
                    const lines = buffer.split('\n')
                    buffer = lines.pop()

                    for (let line of lines) {
                        line = line.trim()
                        if (!line) continue

                        try {
                            const parsedData = JSON.parse(line)

                            if (parsedData.type === 'telemetry') {
                                parsedData.timestamp = Date.now()
                                latestData = parsedData

                                historyData.push(parsedData)
                                if (historyData.length > MAX_HISTORY) {
                                    historyData.shift()
                                }

                                fs.writeFile(HISTORY_FILE, JSON.stringify(historyData, null, 2))
                                    .catch(err => console.error('[file][failed] 写入失败:', err.message))

                                broadcastData(parsedData)
                                continue
                            }

                            if (parsedData.type === 'threshold') {
                                broadcastThreshold(parsedData)
                                continue
                            }

                            if (parsedData.type === 'set_threshold_ack') {
                                broadcastThresholdAck(parsedData)
                                continue
                            }

                            broadcast(parsedData)
                        } catch (e) {
                            console.log('[TCP][failed] JSON解析失败，丢弃的数据:', line)
                        }
                    }
                })

                socket.on('end', () => {
                    console.log('[TCP] 设备断开')
                    broadcastStatus(false)
                    if (activeSocket === socket) {
                        activeSocket = null
                    }
                })

                socket.on('close', () => {
                    console.log('[TCP] 连接关闭')
                    clearInterval(heartbeatTimer)
                    heartbeatTimer = null
                    broadcastStatus(false)
                    if (activeSocket === socket) {
                        activeSocket = null
                    }
                })

                socket.on('error', (err) => {
                    console.log('[TCP] 连接错误:', err.message)
                    broadcastStatus(false)
                    if (activeSocket === socket) {
                        activeSocket = null
                    }
                })
            })

            tcpServer.listen(8080, () => {
                console.log('\x1b[32m%s\x1b[0m', '[bridge] TCP:8080 | WS:8081 已就绪，等待设备连接...')
            })
        },
        closeBundle() {
            if (wss) wss.close()
            if (tcpServer) tcpServer.close()
        }
    }
}
