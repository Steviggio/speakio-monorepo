# scripts/once.ps1
$ErrorActionPreference = "Stop"

# 1. Collect all local issue markdown files
$issuesPath = ".scratch/roadmap-mindmap/issues/*.md"
$issueFiles = Get-ChildItem -Path $issuesPath -ErrorAction SilentlyContinue

if (-not $issueFiles) {
    Write-Error "No issue files found in .scratch/roadmap-mindmap/issues/"
    exit 1
}

$issuesContent = ($issueFiles | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n---`n"

# 2. Get recent git commits for context
$recentCommits = (git log -n 5 --oneline) -join "`n"

# 3. Construct the prompt
$prompt = @"
You are an autonomous AFK implementation agent.

Current Backlog:
$issuesContent

Recent Commits:
$recentCommits

Instructions:
1. Review the issues and identify the next uncompleted issue whose dependencies ('Blocked by') are already satisfied in git commits.
2. If ALL issues are completed, output 'ALL_TASKS_COMPLETE' and exit immediately without modifying files.
3. Follow strict Test-Driven Development (TDD):
   - First, create/update tests matching the ticket's explicit testing seam.
   - Run 'powershell -File ./scripts/test-gate.ps1' to confirm tests fail for the right reason.
   - Implement the minimal clean code to make them pass.
   - Run 'powershell -File ./scripts/test-gate.ps1' again until it exits with code 0.
4. Once all checks pass:
   - Stage all relevant changes ('git add .')
   - Commit with message: 'feat: [ticket-name] <description>'
   - Exit cleanly.
"@

# 4. Invoke Antigravity CLI headlessly
# If your binary is aliased as 'agy' or 'antigravity', use it here:
agy -p $prompt --dangerously-skip-permissions