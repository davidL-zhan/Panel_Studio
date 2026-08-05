// DDD §07-component-architecture.md §3.3 — WebSocket 连接状态 Store
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { WsConnectionStatus } from '@/types/enums'
import { WS } from '@/constants/design-tokens'

export const useWebSocketStore = defineStore('webSocket', () => {
  const status = ref<WsConnectionStatus>(WsConnectionStatus.DISCONNECTED)
  const lastSequenceId = ref(0)
  const missedEventCount = ref(0)
  const reconnectAttempt = ref(0)

  let ws: WebSocket | null = null
  let onEventHandler: ((data: any) => void) | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function getWsUrl(discussionId: string, lastSeq?: number): string {
    const base = import.meta.env.VITE_WS_BASE ?? 'ws://localhost:8000'
    const params = lastSeq ? `?last_seq=${lastSeq}` : ''
    return `${base}/ws/discussions/${discussionId}${params}`
  }

  function resetCounters() {
    lastSequenceId.value = 0
    missedEventCount.value = 0
    reconnectAttempt.value = 0
  }

  function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', last_seq: lastSequenceId.value }))
      }
    }, WS.heartbeatInterval)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function connect(discussionId: string) {
    status.value = WsConnectionStatus.CONNECTING
    resetCounters()
    stopHeartbeat()

    ws = new WebSocket(getWsUrl(discussionId))

    ws.onopen = () => {
      status.value = WsConnectionStatus.CONNECTED
      reconnectAttempt.value = 0
      startHeartbeat()
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (onEventHandler) onEventHandler(data)
      } catch { /* ignore parse errors */ }
    }

    ws.onclose = () => {
      stopHeartbeat()
      if (reconnectAttempt.value < WS.maxReconnectAttempts) {
        attemptReconnect(discussionId)
      } else {
        status.value = WsConnectionStatus.DISCONNECTED
      }
    }
  }

  function attemptReconnect(discussionId: string) {
    status.value = WsConnectionStatus.RECONNECTING
    const delay = WS.reconnectDelays[reconnectAttempt.value] ?? 4000
    reconnectTimer = setTimeout(() => {
      reconnectAttempt.value++
      ws = new WebSocket(getWsUrl(discussionId, lastSequenceId.value))
      ws.onopen = () => {
        status.value = WsConnectionStatus.CONNECTED
        reconnectAttempt.value = 0
        startHeartbeat()
      }
      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (onEventHandler) onEventHandler(data)
        } catch { /* ignore */ }
      }
      ws.onclose = () => {
        stopHeartbeat()
        if (reconnectAttempt.value < WS.maxReconnectAttempts) {
          attemptReconnect(discussionId)
        } else {
          status.value = WsConnectionStatus.DISCONNECTED
        }
      }
    }, delay)
  }

  function send(data: object) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  function disconnect() {
    stopHeartbeat()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.onclose = null // 防止触发重连
      ws.close()
      ws = null
    }
    status.value = WsConnectionStatus.DISCONNECTED
    resetCounters()
  }

  function setEventHandler(handler: (data: any) => void) {
    onEventHandler = handler
  }

  return {
    status,
    lastSequenceId,
    missedEventCount,
    reconnectAttempt,
    connect,
    disconnect,
    send,
    setEventHandler,
  }
})
