<#
Detects Git Bash on Windows and sets the CLAUDE_CODE_GIT_BASH_PATH machine environment
variable so Claude Code can find bash.exe when Git is not installed at a default location.

Intune: Devices > Scripts and remediations > Platform scripts > Add (Windows 10 and later).
  Run this script using the logged on credentials: No
  Run script in 64 bit PowerShell Host: Yes

If Git Bash is already present at a well-known default location Claude Code will detect it
automatically; you only need this script when Git is installed to a custom directory.
#>

$ErrorActionPreference = 'Stop'

# Common non-default install roots — extend this list for your environment.
$candidates = @(
    'D:\Git\bin\bash.exe',
    'D:\Program Files\Git\bin\bash.exe',
    'C:\Tools\Git\bin\bash.exe'
)

# Well-known default locations that Claude Code already detects on its own.
$defaults = @(
    "$env:ProgramFiles\Git\bin\bash.exe",
    "${env:ProgramFiles(x86)}\Git\bin\bash.exe",
    "$env:LocalAppData\Programs\Git\bin\bash.exe"
)

function Find-GitBash {
    # 1. Honour an existing machine-level value (idempotent re-runs).
    $existing = [System.Environment]::GetEnvironmentVariable('CLAUDE_CODE_GIT_BASH_PATH', 'Machine')
    if ($existing -and (Test-Path $existing)) {
        return $existing
    }

    # 2. Check the candidates provided above.
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }

    # 3. Fall back to `where.exe` in case Git is on PATH but not in a default location.
    try {
        $fromPath = & where.exe bash.exe 2>$null | Select-Object -First 1
        if ($fromPath -and (Test-Path $fromPath)) {
            # Only set if it is not one of the defaults Claude Code auto-detects.
            $isDefault = $defaults | Where-Object { $_ -eq $fromPath }
            if (-not $isDefault) { return $fromPath }
        }
    } catch { }

    return $null
}

$bashPath = Find-GitBash

if ($bashPath) {
    [System.Environment]::SetEnvironmentVariable('CLAUDE_CODE_GIT_BASH_PATH', $bashPath, 'Machine')
    Write-Output "Set CLAUDE_CODE_GIT_BASH_PATH = $bashPath"
} else {
    Write-Output "Git Bash not found at any non-default location; no change made."
    Write-Output "If Git is installed at a custom path, add it to the `$candidates list in this script."
}
