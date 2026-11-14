from fastapi import FastAPI

app = FastAPI(
    title="Lunar-Si API",
    description="Lunar Landing Site Navigator",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "project": "Lunar-Si",
        "message": "Backend is running"
    }