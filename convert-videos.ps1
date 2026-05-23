# Requiere: ffmpeg instalado y accesible en PATH
# Ejecutar desde la raíz del proyecto: .\convert-videos.ps1

param(
    [string]$VideoDir = (Join-Path $PSScriptRoot "assets\videos"),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

if (-Not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw "FFmpeg no está instalado o no está en PATH."
}

if (-Not (Test-Path $VideoDir)) {
    throw "No existe la carpeta de videos: $VideoDir"
}

$mp4Files = Get-ChildItem -Path $VideoDir -Filter '*.mp4' -File | Sort-Object Name
if (-Not $mp4Files) {
    Write-Warning "No se encontraron archivos .mp4 en $VideoDir"
    return
}

$webmVideoCodec = 'libvpx'
Write-Host "Usando codec WebM: $webmVideoCodec" -ForegroundColor Cyan
Write-Host "Procesando $($mp4Files.Count) archivos .mp4..." -ForegroundColor Cyan

foreach ($file in $mp4Files) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $webmPath = Join-Path $VideoDir "$baseName.webm"
    $ogvPath = Join-Path $VideoDir "$baseName.ogv"

    if ((Test-Path $webmPath) -and (Test-Path $ogvPath) -and -Not $Force) {
        Write-Host "Saltando $($file.Name) (ya existen .webm y .ogv)" -ForegroundColor Yellow
        continue
    }

    Write-Host "Convirtiendo $($file.Name)" -ForegroundColor Green

    if (-Not (Test-Path $webmPath) -or $Force) {
        $webmArgs = @(
            '-nostdin', '-y', '-i', $file.FullName,
            '-c:v', $webmVideoCodec,
            '-crf', '30',
            '-b:v', '0',
            '-c:a', 'libvorbis',
            '-qscale:a', '4',
            '-pix_fmt', 'yuv420p',
            $webmPath
        )

        & ffmpeg @webmArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Error convirtiendo $($file.Name) a WebM"
        }
    }

    if (-Not (Test-Path $ogvPath) -or $Force) {
        $ogvArgs = @(
            '-nostdin', '-y', '-i', $file.FullName,
            '-c:v', 'libtheora',
            '-qscale:v', '5',
            '-c:a', 'libvorbis',
            '-qscale:a', '4',
            '-pix_fmt', 'yuv420p',
            $ogvPath
        )

        & ffmpeg @ogvArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Error convirtiendo $($file.Name) a OGV"
        }
    }
}

Write-Host "Conversión completada." -ForegroundColor Green
