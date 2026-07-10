from pydantic_settings import BaseSettings


class AppConfig(BaseSettings):
    database_url: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False


config = AppConfig()
