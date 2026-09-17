# scripts/loop.ps1
$maxIterations = 10
$iteration = 0

Write-Host " Starting Antigravity CLI AFK Loop..." -ForegroundColor Cyan

while ($iteration -lt $maxIterations) {
    $iteration++
    Write-Host "`n=== Iteration $iteration of $maxIterations ===" -ForegroundColor Yellow

    # Execute one ticket in a clean context window
    $output = & powershell -File ./scripts/once.ps1 2>&1
    $output | ForEach-Object { Write-Host $_ }

    # Check if all tickets have finished
    if ($output -match "ALL_TASKS_COMPLETE") {
        Write-Host "`n All backlog tickets completed successfully!" -ForegroundColor Green
        exit 0
    }

    # Verify working tree status
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "Working tree is dirty after iteration. Check status:"
        git status
    }

    Start-Sleep -Seconds 3
}

Write-Host " Reached maximum iteration limit ($maxIterations)." -ForegroundColor Red