"""SDD §02-api-contract §3 — WebSocket 连接管理 + 事件推送"""
import json
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # discussion_id → set of WebSocket
        self._connections: dict[str, set[WebSocket]] = {}
        self._seq: dict[str, int] = {}  # discussion_id → sequence_id

    async def connect(self, discussion_id: str, ws: WebSocket):
        await ws.accept()
        self._connections.setdefault(discussion_id, set()).add(ws)
        if discussion_id not in self._seq:
            self._seq[discussion_id] = 0

    def disconnect(self, discussion_id: str, ws: WebSocket):
        if discussion_id in self._connections:
            self._connections[discussion_id].discard(ws)

    async def broadcast(self, discussion_id: str, event: str, data: dict):
        if discussion_id not in self._connections:
            return

        self._seq[discussion_id] += 1
        envelope = {
            "event": event,
            "sequence_id": self._seq[discussion_id],
            "data": data,
            "timestamp": data.get("timestamp", ""),
        }
        payload = json.dumps(envelope, default=str)

        dead: list[WebSocket] = []
        for ws in self._connections[discussion_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(discussion_id, ws)

    async def broadcast_initial_state(self, discussion_id: str, ws: WebSocket, state: dict):
        """单播给新连接的客户端"""
        envelope = {
            "event": "initial_state",
            "sequence_id": 0,
            "data": state,
            "timestamp": "",
        }
        try:
            await ws.send_text(json.dumps(envelope, default=str))
        except Exception:
            pass

    def has_connections(self, discussion_id: str) -> bool:
        return len(self._connections.get(discussion_id, set())) > 0


manager = ConnectionManager()
