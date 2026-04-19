# Script para levantar backend y ejecutar tests
# Uso: .\scripts\run-tests-with-backend.ps1

Write-Host "🚀 Starting backend and tests..." -ForegroundColor Cyan

# Cambiar al directorio del API
Set-Location $PSScriptRoot\..

# Verificar si el backend ya está corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/healthz" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend already running" -ForegroundColor Green
    $backendRunning = $true
} catch {
    Write-Host "⏳ Backend not running, starting it..." -ForegroundColor Yellow
    $backendRunning = $false
    
    # Iniciar backend en background
    $env:PORT = "4001"
    $env:NODE_ENV = "development"
    $backendProcess = Start-Process -FilePath "npm" -ArgumentList "run","dev" -PassThru -WindowStyle Hidden
    
    Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
    
    # Esperar hasta 30 segundos
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4001/healthz" -TimeoutSec 1 -ErrorAction Stop
            Write-Host "✅ Backend is ready!" -ForegroundColor Green
            $backendRunning = $true
            break
        } catch {
            Write-Host "." -NoNewline
        }
    }
    
    if (-not $backendRunning) {
        Write-Host ""
        Write-Host "❌ Backend failed to start in time" -ForegroundColor Red
        if ($backendProcess) {
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar tests
npm run test:generation
$testExitCode = $LASTEXITCODE

# Si levantamos el backend, detenerlo
if (-not $backendRunning -and $backendProcess) {
    Write-Host ""
    Write-Host "🛑 Stopping backend..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
}

exit $testExitCode

