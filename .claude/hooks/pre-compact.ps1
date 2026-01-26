# Pre-compaction hook: Updates CLAUDE.md with recent uncommitted changes

$ErrorActionPreference = "SilentlyContinue"

# Change to project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

# Get current date
$date = Get-Date -Format "yyyy-MM-dd HH:mm"

# Check if there are uncommitted changes
$diffOutput = git diff --name-only HEAD 2>$null
$stagedOutput = git diff --cached --name-only 2>$null

if (-not $diffOutput -and -not $stagedOutput) {
    Write-Host "No uncommitted changes to document"
    exit 0
}

# Check if CLAUDE.md exists
if (-not (Test-Path "CLAUDE.md")) {
    Write-Host "CLAUDE.md not found"
    exit 0
}

# Combine and deduplicate modified files
$allFiles = @()
if ($diffOutput) { $allFiles += $diffOutput -split "`n" }
if ($stagedOutput) { $allFiles += $stagedOutput -split "`n" }
$uniqueFiles = $allFiles | Sort-Object -Unique | Where-Object { $_ -ne "" }

# Read current CLAUDE.md
$content = Get-Content "CLAUDE.md" -Raw

# Remove old pending changes section if it exists
$content = $content -replace "(?s)## Pending Changes \(Pre-Compaction\).*?(?=## [^P]|$)", ""

# Create new pending changes section
$pendingSection = @"

## Pending Changes (Pre-Compaction)

**Last updated:** $date

### Modified Files:
$($uniqueFiles | ForEach-Object { "- $_" } | Out-String)
### Summary:
Review git diff for details on what changed in this session.

"@

# Append to CLAUDE.md
$content = $content.TrimEnd() + "`n" + $pendingSection

# Write back
$content | Set-Content "CLAUDE.md" -NoNewline

Write-Host "Updated CLAUDE.md with pending changes"
