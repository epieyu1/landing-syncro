#!/bin/bash

# Función para limpiar procesos al salir (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit
}

# Configurar la trampa para señal de salida
trap cleanup SIGINT

echo "🚀 Iniciando Syncro Leads Manager..."
echo "------------------------------------------------"

# 1. Iniciar Backend
echo "🐍 Levantando Backend (FastAPI)..."
cd syncro-leads-manager/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
echo "✅ Backend corriendo (PID $BACKEND_PID)"

# 2. Iniciar Frontend
echo "⚛️  Levantando Frontend (React)..."
cd ../frontend
# Aseguramos que las dependencias estén bien antes de arrancar
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias (esto puede tardar un poco la primera vez)..."
    npm install > /dev/null 2>&1
fi

npm run dev -- --host &
FRONTEND_PID=$!

echo "------------------------------------------------"
echo "🎉 ¡Todo listo!"
echo "👉 Abre tu navegador en: http://localhost:5173"
echo "------------------------------------------------"
echo "Presiona Ctrl+C para detener."
echo ""

# Esperar indefinidamente para mantener el script corriendo y atrapar Ctrl+C
wait
