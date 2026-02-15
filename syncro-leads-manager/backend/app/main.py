from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Syncro Leads Manager", version="1.0.0")

# Configurar CORS (para que el frontend React pueda hablar con el backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar esto por la URL del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Syncro Leads Manager API is running 🚀"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Importar y registrar rutas
from app.api.endpoints import router as api_router
from app.api.templates import router as templates_router
from app.api.whatsapp import router as whatsapp_router

app.include_router(api_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(whatsapp_router, prefix="/api")
