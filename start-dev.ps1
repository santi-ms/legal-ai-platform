# Script para iniciar Frontend y Backend simultáneamente
# Uso: .\start-dev.ps1

Write-Host "🚀 Iniciando Legal AI Platform..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "✅ Iniciando servicios..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📍 Backend:  http://localhost:4001" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Presiona Ctrl+C para detener ambos servicios" -ForegroundColor Yellow
Write-Host ""

# Iniciar ambos servicios con turbo
npm run dev

