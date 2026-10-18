$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
  Write-Error "No existe backend\venv. Cree el entorno e instale backend\requirements.txt."
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  $ffmpeg = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($ffmpeg) {
    $env:Path = "$($ffmpeg.DirectoryName);$env:Path"
  }
}

& "backend\venv\Scripts\python.exe" -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
