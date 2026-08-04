import asyncio
import json
from typing import Dict, List

import anyio
from fastapi import WebSocket


class RealtimeManager:
    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self._connections.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self._connections:
            self._connections[user_id] = [c for c in self._connections[user_id] if c is not ws]
            if not self._connections[user_id]:
                del self._connections[user_id]

    def push_to_user(self, user_id: str, notification) -> None:
        conns = self._connections.get(user_id, [])
        if not conns:
            return

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        payload = json.dumps(
            {
                "id": str(notification.id),
                "type": notification.type,
                "title": notification.title,
                "body": notification.body,
                "link": notification.link,
                "created_at": notification.created_at.isoformat(),
                "is_read": notification.is_read,
            }
        )
        for ws in list(conns):
            try:
                if loop and loop.is_running():
                    loop.create_task(ws.send_text(payload))
                else:
                    anyio.from_thread.run(ws.send_text, payload)
            except RuntimeError:
                break
            except Exception:
                self.disconnect(user_id, ws)


realtime_manager = RealtimeManager()
