"""SDD TDD 矩阵 — 后端 REST API 测试"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


def _client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_list_discussions():
    async with _client() as c:
        resp = await c.get("/api/discussions")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_create_discussion():
    async with _client() as c:
        resp = await c.post("/api/discussions", json={"topic": "test", "expert_count": 5})
        assert resp.status_code == 201
        data = resp.json()
        assert data["topic"] == "test"
        assert data["status"] == "PENDING_PANEL"


@pytest.mark.asyncio
async def test_topic_validation():
    async with _client() as c:
        resp = await c.post("/api/discussions", json={"topic": "x" * 201, "expert_count": 4})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_expert_count_range():
    async with _client() as c:
        r3 = await c.post("/api/discussions", json={"topic": "t", "expert_count": 3})
        assert r3.status_code == 422
        r9 = await c.post("/api/discussions", json={"topic": "t", "expert_count": 9})
        assert r9.status_code == 422


@pytest.mark.asyncio
async def test_discussion_404():
    async with _client() as c:
        r = await c.get("/api/discussions/nonexistent")
        assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_404():
    async with _client() as c:
        r = await c.delete("/api/discussions/nonexistent")
        assert r.status_code == 404


@pytest.mark.asyncio
async def test_start_invalid_status():
    async with _client() as c:
        r1 = await c.post("/api/discussions", json={"topic": "s", "expert_count": 4})
        disc_id = r1.json()["id"]
        r2 = await c.post(f"/api/discussions/{disc_id}/start")
        assert r2.status_code == 409


@pytest.mark.asyncio
async def test_end_invalid_status():
    async with _client() as c:
        r1 = await c.post("/api/discussions", json={"topic": "e", "expert_count": 4})
        disc_id = r1.json()["id"]
        r2 = await c.post(f"/api/discussions/{disc_id}/end")
        assert r2.status_code == 409


@pytest.mark.asyncio
async def test_transcript_empty():
    async with _client() as c:
        r1 = await c.post("/api/discussions", json={"topic": "tr", "expert_count": 4})
        disc_id = r1.json()["id"]
        r2 = await c.get(f"/api/discussions/{disc_id}/transcript")
        assert r2.status_code == 200
        assert r2.json()["total"] == 0


@pytest.mark.asyncio
async def test_consensus_empty():
    async with _client() as c:
        r1 = await c.post("/api/discussions", json={"topic": "co", "expert_count": 4})
        disc_id = r1.json()["id"]
        r2 = await c.get(f"/api/discussions/{disc_id}/consensus")
        assert r2.status_code == 200
        assert r2.json() == []
