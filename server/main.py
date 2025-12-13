from fastapi import FastAPI
from api.v1.routes import artikel_router, inventory_router
import uvicorn

app = FastAPI(
    title="Artikel API",
    description="API for managing construction articles",
    version="1.0.0"
)

# Include routers
app.include_router(artikel_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Artikel API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

def main():
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
