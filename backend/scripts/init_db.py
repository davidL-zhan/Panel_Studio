"""SDD 交付物 — 数据库初始化脚本（仅建表，不含数据）"""
import asyncio, sys, io
sys.path.insert(0, ".")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from app.database import init_db

async def run():
    await init_db()
    print("[OK] Database tables created")

asyncio.run(run())
