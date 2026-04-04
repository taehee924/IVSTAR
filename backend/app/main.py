from fastapi import FastAPI
from sqlalchemy import text
from app.core.database import engine

app = FastAPI()

@app.get("/")
def root():
    return {"message": "API running"}

@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        return {"db": "connected", "result": result.scalar()}