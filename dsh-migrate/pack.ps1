# pack.ps1 - run INSIDE the VM: snapshot %USERPROFILE%\.dsh plus every registered workspace.
#
#   .\pack.ps1 -Destination E:\dsh-backup
#   .\pack.ps1 -Destination E:\dsh-backup -IncludeRuntimes
#   .\pack.ps1 -Destination E:\dsh-backup -Force   # stops DSH first
#
# The destination ends up as:
#   <Destination>\.dsh\                  (all session/config state)
#   <Destination>\workspaces\<n>-<name>\ (a copy of every workspace folder)
#   <Destination>\manifest.json          (old paths + how they map to folders)
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Destination,
  [switch]$IncludeRuntimes,
  [switch]$SkipWorkspaces,
  [switch]$Force,
  # Escape hatch: pack a DSH home that is NOT the one the running app uses (e.g. DSH_HOME overridden for a dry run).
  [switch]$SkipRunningCheck
)

$ErrorActionPreference = 'Stop'

function Get-FullPath([string]$p) {
  return [System.IO.Path]::GetFullPath($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($p))
}

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
if (-not (Test-Path -LiteralPath $dshHome)) { throw "DSH home not found: $dshHome" }

$destFull = Get-FullPath $Destination
$homeFull = Get-FullPath $dshHome

# --- 0. refuse destinations that would copy a folder into itself -------------
if ($destFull.TrimEnd('\') -eq $homeFull.TrimEnd('\') -or $destFull.StartsWith($homeFull.TrimEnd('\') + '\', 'OrdinalIgnoreCase')) {
  throw "Destination $destFull is inside the DSH home $homeFull. Pick somewhere else."
}

$workspaceFile = Join-Path $dshHome 'storages\workspace.json'
$workspaces = @()
if (Test-Path -LiteralPath $workspaceFile) {
  $ws = Get-Content -LiteralPath $workspaceFile -Raw | ConvertFrom-Json
  foreach ($prop in $ws.tables.workspaces.PSObject.Properties) {
    $workspaces += [pscustomobject]@{ id = $prop.Name; title = $prop.Value.title; path = $prop.Value.path }
  }
}

foreach ($w in $workspaces) {
  $wp = Get-FullPath $w.path
  if ($destFull.StartsWith($wp.TrimEnd('\') + '\', 'OrdinalIgnoreCase')) {
    throw "Destination $destFull is inside workspace $($w.path), which would copy the workspace into itself. Pick somewhere else."
  }
}

# --- 1. make sure DSH is not writing while we copy ---------------------------
$running = Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue
if ($running -and -not $SkipRunningCheck) {
  if (-not $Force) {
    throw 'DeepSeek Harness is running. Quit it first (this also ends any live agent session), then rerun with -Force if you want pack.ps1 to stop it.'
  }
  $running | Stop-Process -Force
  Start-Sleep -Seconds 3
}

New-Item -ItemType Directory -Path $destFull -Force | Out-Null

# --- 2. .dsh ----------------------------------------------------------------
$destHome = Join-Path $destFull '.dsh'
$excludeDirs = @(Join-Path $dshHome 'cache')
if (-not $IncludeRuntimes) { $excludeDirs += (Join-Path $dshHome 'dsh-runtimes') }

Write-Host "Copying $dshHome -> $destHome"
$rcArgs = @($dshHome, $destHome, '/E', '/R:1', '/W:1', '/NFL', '/NDL', '/NP')
if ($excludeDirs.Count -gt 0) { $rcArgs += @('/XD') + $excludeDirs }
& robocopy @rcArgs | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

# --- 3. workspaces ----------------------------------------------------------
$manifest = [ordered]@{
  packedAt        = (Get-Date).ToString('o')
  sourceMachine   = $env:COMPUTERNAME
  sourceUser      = $env:USERNAME
  dshHome         = $dshHome
  dshVersion      = (Get-Item "$env:LOCALAPPDATA\Programs\DeepSeek Harness\DeepSeek Harness.exe" -ErrorAction SilentlyContinue).VersionInfo.FileVersion
  includeRuntimes = [bool]$IncludeRuntimes
  workspaces      = @()
}

if (-not $SkipWorkspaces) {
  $i = 0
  foreach ($w in $workspaces) {
    $i++
    $leaf = Split-Path -Leaf $w.path
    $folder = '{0:d2}-{1}' -f $i, ($leaf -replace '[^\w\.\- ]', '_')
    Write-Host ("[{0}] Copying workspace {1} -> workspaces\{2}" -f (Get-Date -Format 'HH:mm:ss'), $w.path, $folder)
    $packedFolder = $null
    if (Test-Path -LiteralPath $w.path) {
      & robocopy $w.path (Join-Path $destFull "workspaces\$folder") /E /R:1 /W:1 /NFL /NDL /NP /XJ | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "robocopy failed for workspace $($w.path) (code $LASTEXITCODE)" }
      $packedFolder = "workspaces\$folder"
    } else {
      Write-Warning "Workspace path missing, recorded only: $($w.path)"
    }
    $manifest.workspaces += [ordered]@{
      id     = $w.id
      title  = $w.title
      path   = $w.path
      folder = $packedFolder
    }
  }
}

# --- 4. manifest ------------------------------------------------------------
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $destFull 'manifest.json') -Encoding utf8
$size = (Get-ChildItem -LiteralPath $destFull -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$sessionCount = @(Get-ChildItem (Join-Path $destHome 'sessions') -Recurse -Filter 'session.*.jsonl*' -ErrorAction SilentlyContinue).Count
Write-Host ''
Write-Host ("Done. {0:N0} MB in {1}" -f ($size / 1MB), $destFull)
Write-Host ("Sessions: {0}   Workspaces: {1}" -f $sessionCount, @($manifest.workspaces).Count)
Write-Host 'Copy this folder to the host, then run restore.ps1 there.'
