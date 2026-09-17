# scripts/test-gate.ps1
$ErrorActionPreference = "Stop"

Write-Host " Running TypeScript checks..." -ForegroundColor Cyan
npm run type-check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host " Running Vitest suite..." -ForegroundColor Cyan
npm test -- --run
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host " All verification gates passed." -ForegroundColor Green
exit 0