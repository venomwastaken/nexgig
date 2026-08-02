import uuid

from fastapi import WebSocket


class ConnectionManager:
    """In-process, per-conversation fan-out. Single server instance only — if this
    ever needs to scale across multiple backend processes, swap the in-memory dict
    for Redis pub/sub. Not needed at current scale."""

    def __init__(self):
        self._active: dict[uuid.UUID, list[WebSocket]] = {}

    async def connect(self, conversation_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active.setdefault(conversation_id, []).append(websocket)

    def disconnect(self, conversation_id: uuid.UUID, websocket: WebSocket) -> None:
        conns = self._active.get(conversation_id)
        if conns and websocket in conns:
            conns.remove(websocket)
        if conns is not None and not conns:
            self._active.pop(conversation_id, None)

    async def broadcast(self, conversation_id: uuid.UUID, payload: dict) -> None:
        # Iterate a shallow copy: a send failure below can trigger disconnect(),
        # which would mutate the live list mid-iteration otherwise.
        for ws in list(self._active.get(conversation_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(conversation_id, ws)


manager = ConnectionManager()
