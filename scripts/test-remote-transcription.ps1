$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& backend\venv\Scripts\python.exe scripts\test_remote_transcription.py
