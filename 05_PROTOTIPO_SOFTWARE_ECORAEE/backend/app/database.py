import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

Base = declarative_base()

# Configurar motor SQLAlchemy con fallback automático para ejecución local
def init_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    try:
        eng = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
        with eng.connect() as conn:
            pass
        print(f"[EcoRAEE DB] Conexión exitosa a Base de Datos: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return eng
    except Exception as e:
        print(f"[EcoRAEE DB] Aviso: No se detectó PostgreSQL en {db_url.split('@')[-1] if '@' in db_url else db_url} ({e.args[0] if e.args else e}).")
        print("[EcoRAEE DB] Activando motor relacional local SQLite (ecoraee_local.db) para ejecución local autónoma.")
        local_sqlite_url = "sqlite:///./ecoraee_local.db"
        return create_engine(local_sqlite_url, connect_args={"check_same_thread": False})

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Generador de sesiones de base de datos para inyección de dependencias."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
