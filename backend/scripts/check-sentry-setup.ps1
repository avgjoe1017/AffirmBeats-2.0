# Sentry Setup Checker
# Checks if Sentry DSN is configured

Write-Host "🔍 Checking Sentry Configuration..." -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".." ".env"

if (Test-Path $envFile) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "SENTRY_DSN\s*=\s*https://") {
        Write-Host "✅ SENTRY_DSN is configured" -ForegroundColor Green
        
        # Extract DSN
        if ($envContent -match "SENTRY_DSN\s*=\s*(https://[^\s]+)") {
            $dsn = $matches[1]
            Write-Host "   DSN: $dsn" -ForegroundColor Gray
        }
        
        # Check environment
        if ($envContent -match "SENTRY_ENVIRONMENT\s*=\s*(\w+)") {
            $env = $matches[1]
            Write-Host "✅ SENTRY_ENVIRONMENT: $env" -ForegroundColor Green
        } else {
            Write-Host "⚠️  SENTRY_ENVIRONMENT not set (optional)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "✅ Sentry is configured!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart your backend server" -ForegroundColor White
        Write-Host "2. Check logs for 'Sentry initialized' message" -ForegroundColor White
        Write-Host "3. Run: bun run test:qa" -ForegroundColor White
    } else {
        Write-Host "❌ SENTRY_DSN not found in .env file" -ForegroundColor Red
        Write-Host ""
        Write-Host "To set up Sentry:" -ForegroundColor Cyan
        Write-Host "1. Get DSN from https://sentry.io" -ForegroundColor White
        Write-Host "2. Add to .env file:" -ForegroundColor White
        Write-Host "   SENTRY_DSN=https://your-dsn@sentry.io/project-id" -ForegroundColor Gray
        Write-Host "   SENTRY_ENVIRONMENT=development" -ForegroundColor Gray
        Write-Host ""
        Write-Host "See: MD_DOCS/SENTRY_SETUP_STEPS.md for detailed instructions" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ .env file does not exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "To create .env file:" -ForegroundColor Cyan
    Write-Host "1. Copy .env.example to .env:" -ForegroundColor White
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host "2. Edit .env and add your Sentry DSN" -ForegroundColor White
    Write-Host ""
    Write-Host "See: MD_DOCS/SENTRY_SETUP_STEPS.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""

