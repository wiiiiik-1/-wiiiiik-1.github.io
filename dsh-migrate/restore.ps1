# restore.ps1 - run ON THE HOST: install the packed .dsh + workspaces and fix absolute paths.
#
#   .\restore.ps1 -Source E:\dsh-backup -Map "C:\Users\Latus=>D:\Latus"
#   .\restore.ps1 -Source E:\dsh-backup -Map "C:\Users\Latus=>C:\Users\anna" -Force
#   .\restore.ps1 -Source E:\dsh-backup -SkipWorkspaces
#
# Run it AFTER installing DeepSeek Harness on the host and BEFORE the first launch.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [string]$DshHome = (Join-Path $env:USERPROFILE '.dsh'),
  [string[]]$Map = @(),
  [switch]$SkipWorkspaces,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$packed = Join-Path $Source '.dsh'
if (-not (Test-Path -LiteralPath $packed)) { throw "No .dsh folder inside $Source" }
if (-not (Test-Path -LiteralPath (Join-Path $packed 'sessions'))) { Write-Warning "Packed .dsh has no sessions folder - check the source path." }

$running = Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue
if ($running) {
  $live = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
  $sameAsLive = ([System.IO.Path]::GetFullPath($DshHome) -eq [System.IO.Path]::GetFullPath($live))
  if ($sameAsLive) { throw 'DeepSeek Harness is running and must be quit before restoring into its live home. Quit it first, then rerun restore.ps1.' }
  Write-Warning 'DeepSeek Harness is running; restoring into a different -DshHome is safe, the running instance will not see it.'
}

function Resolve-Node {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $bundled = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\runtime\bin\node.exe'
  if (Test-Path -LiteralPath $bundled) { return $bundled }
  throw 'node.exe not found - install Node.js or install DeepSeek Harness first.'
}

function Get-MappedPath([string]$path) {
  if ($Map.Count -eq 0) { return $path }
  $node = Resolve-Node
  $script = Join-Path $PSScriptRoot 'tools\map-path.mjs'
  $nodeArgs = @($script)
  foreach ($m in $Map) { $nodeArgs += @('--map', $m) }
  $nodeArgs += @('--path', $path)
  $out = & $node @nodeArgs
  if ($LASTEXITCODE -eq 2) { return $path }
  if ($LASTEXITCODE -ne 0) { throw "map-path failed for $path" }
  return $out.Trim()
}

# --- 1. .dsh ---------------------------------------------------------------
if (Test-Path -LiteralPath $DshHome) {
  $existing = @(Get-ChildItem -LiteralPath $DshHome -Force)
  if ($existing.Count -gt 0) {
    if (-not $Force) { throw "$DshHome already exists and is not empty. Rename it away or pass -Force." }
    $aside = "$DshHome.before-restore-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
    Move-Item -LiteralPath $DshHome -Destination $aside
    Write-Host "Existing DSH home moved to $aside"
  }
}
New-Item -ItemType Directory -Path $DshHome -Force | Out-Null
Write-Host "Restoring $packed -> $DshHome"
& robocopy $packed $DshHome /E /R:1 /W:1 /NFL /NDL /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

# --- 2. path rewrite -------------------------------------------------------
if ($Map.Count -gt 0) {
  $node = Resolve-Node
  $remap = Join-Path $PSScriptRoot 'tools\remap.mjs'
  Write-Host "Rewriting absolute paths: $($Map -join '; ')"
  $nodeArgs = @($remap, '--home', $DshHome)
  foreach ($m in $Map) { $nodeArgs += @('--map', $m) }
  & $node @nodeArgs
  if ($LASTEXITCODE -ne 0) { throw 'remap failed - .dsh is still usable with the old paths, see sessions.bak-* for rollback.' }

  $verify = Join-Path $PSScriptRoot 'tools\verify.mjs'
  & $node $verify '--home' $DshHome
} else {
  Write-Warning 'No -Map given: session directories and workspace.json keep the old absolute paths. They only work if those exact paths exist on this host.'
}

# --- 3. workspaces ---------------------------------------------------------
if (-not $SkipWorkspaces) {
  $manifestPath = Join-Path $Source 'manifest.json'
  if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    foreach ($w in $manifest.workspaces) {
      if (-not $w.folder) { Write-Warning "Workspace not packed (missing in VM): $($w.path)"; continue }
      $from = Join-Path $Source $w.folder
      $to = Get-MappedPath $w.path
      if ($to -eq $w.path) { Write-Warning "Workspace restored to its old path: $to" }
      Write-Host "Restoring workspace $from -> $to"
      New-Item -ItemType Directory -Path (Split-Path -Parent $to) -Force | Out-Null
      & robocopy $from $to /E /R:1 /W:1 /NFL /NDL /NP /XJ | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "robocopy failed for workspace $to (code $LASTEXITCODE)" }
    }
  } else {
    Write-Warning "No manifest.json in $Source - copy the workspace folders manually."
  }
}

Write-Host ''
Write-Host 'Done. Now launch DeepSeek Harness and check:'
Write-Host '  - the workspace list shows every folder with its sessions'
Write-Host '  - opening an old session shows its history and can run a new command'
Write-Host '  - if the account looks logged out, sign in again (credentials are machine-bound)'
