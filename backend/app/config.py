"""SDD 技术要求：API Key 仅从系统环境变量读取，不写入文件"""

from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    deepseek_api_key: str | None = os.getenv("DEEPSEEK_API_KEY")
    if not deepseek_api_key:
        raise ValueError("DEEPSEEK_API_KEY environment variable not set")
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"
    database_url: str = "sqlite+aiosqlite:///./panel_studio.db"


settings = Settings()
