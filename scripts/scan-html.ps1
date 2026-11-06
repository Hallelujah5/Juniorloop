# Daily scan of the HTML sources into production. Run by the "JuniorLoop Daily Scan"
# Windows scheduled task; see the README for how to register or remove it.
#
# Each source runs separately so each keeps its own track rotation: in one combined
# run, a source that stays blocked would pin the other source to the same track.
# Each run covers one track, which is the politeness budget. Do not add more runs.
param([switch]$DryRun)

# Windows PowerShell's default encodings garble both Node's output and the log.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$log = Join-Path $repo 'scan-html.log'
Set-Location $repo

function Write-Log([string[]]$Lines) {
  $Lines | ForEach-Object { $_; Add-Content -Path $log -Value $_ -Encoding UTF8 }
}

$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
if (-not $pnpm) {
  Write-Log "$(Get-Date -Format s) pnpm not found on PATH, nothing scanned"
  exit 1
}

$failed = $false
foreach ($source in 'itviec', 'topcv') {
  Write-Log "=== $(Get-Date -Format s) $source"
  $scanArgs = @('scan', '--prod', '--sources', $source)
  if ($DryRun) { $scanArgs += '--dry-run' }
  $output = & $pnpm @scanArgs 2>&1 | ForEach-Object { "$_" } |
    Where-Object { $_ -match '^\[(env|rotation|dry-run|kill-switch|itviec|topcv|expiry|dedupe|reclassify|revalidate)' }
  $exitCode = $LASTEXITCODE
  if ($output) { Write-Log $output }
  if ($exitCode -ne 0 -or ($output -match '\] ERROR')) { $failed = $true }
}

# A failed scan is already recorded in scan_runs and shows on /status. The exit code
# makes it visible in Task Scheduler as well.
if ($failed) { exit 1 }
