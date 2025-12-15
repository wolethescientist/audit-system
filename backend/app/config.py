from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str
    
    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    
    # GEMINI AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    # Performance Monitoring Configuration
    PERFORMANCE_MONITORING_ENABLED: bool = True
    PERFORMANCE_ALERT_THRESHOLD_CPU: float = 80.0
    PERFORMANCE_ALERT_THRESHOLD_MEMORY: float = 85.0
    PERFORMANCE_ALERT_THRESHOLD_DISK: float = 90.0
    
    # Audit Trail Configuration
    AUDIT_TRAIL_RETENTION_DAYS: int = 2555  # 7 years for ISO compliance
    AUDIT_TRAIL_LOG_ALL_REQUESTS: bool = True
    
    # System Integration Configuration
    SYSTEM_INTEGRITY_CHECK_INTERVAL_HOURS: int = 24
    DATABASE_OPTIMIZATION_ENABLED: bool = True
    
    # Supabase Storage Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_BUCKET_NAME: str = "audit-evidence"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
