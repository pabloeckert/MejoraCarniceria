#!/bin/bash
# ============================================
# MejoraCarniceria - Script de setup completo
# ============================================
# Uso: bash setup.sh [--build-all]
#
# Sin flags: Solo instala dependencias e inicia la app
# --build-all: Instala dependencias, inicia, y genera instaladores

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🥩 MejoraCarniceria - Setup${NC}"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no encontrado.${NC}"
    echo "   Instalalo desde: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ requerido. Tenés v$(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Install dependencies
echo ""
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
npm install

# Create data directory
mkdir -p data

# Start the app to verify it works
echo ""
echo -e "${BLUE}🧪 Verificando que la app funciona...${NC}"
timeout 5 node src/backend/server.js &
SERVER_PID=$!
sleep 2

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor funcionando${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor no respondió (puede ser normal si curl no está disponible)${NC}"
fi

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# Build installers if requested
if [ "$1" = "--build-all" ]; then
    echo ""
    echo -e "${BLUE}🔨 Generando instalador Windows...${NC}"
    npm run build:windows-installer || echo -e "${YELLOW}⚠️  Build Windows falló (ver INSTALL.md)${NC}"

    echo ""
    echo -e "${BLUE}📱 Generando APK Android...${NC}"
    npm run build:android-apk || echo -e "${YELLOW}⚠️  Build Android falló (ver INSTALL.md)${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup completado!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Para iniciar la app:"
echo "  npm start"
echo ""
echo "Luego abrí en tu navegador:"
echo "  http://localhost:3000"
echo ""
echo "Para generar instaladores:"
echo "  npm run build:all"
echo ""
