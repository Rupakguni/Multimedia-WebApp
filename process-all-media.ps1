# Script maestro para procesar imagenes, videos y audio desde ImaganesVideosPropios
# Genera variantes responsivas y formatos optimizados

Write-Host "===== PROCESANDO IMAGENES =====" -ForegroundColor Cyan

# Copiar y procesar imagenes de Alcudia
$alcudiaImages = @('alcudia1','alcudia2','alcudia3','alcudia4','alcudia5','alcudia6','alcudia7','alcudia8','alcudia9')
$pollencaImages = @('pollenca1','pollenca2','pollenca3','pollenca4','pollenca5','pollenca6','pollenca7','pollenca8')

foreach ($img in $alcudiaImages) {
    $source = "assets/ImaganesVideosPropios/$img.jpg"
    if (Test-Path $source) {
        Write-Host "Alcudia: $img"
        magick $source -strip -quality 75 -resize 400 "assets/img/Alcudia-$img-400.jpg"
        magick $source -strip -quality 75 -resize 800 "assets/img/Alcudia-$img-800.jpg"
        magick $source -strip -quality 75 -resize 1280 "assets/img/Alcudia-$img-1280.jpg"
        magick $source -strip -quality 80 -resize 400 "assets/img/Alcudia-$img-400.webp"
        magick $source -strip -quality 80 -resize 800 "assets/img/Alcudia-$img-800.webp"
        magick $source -strip -quality 80 -resize 1280 "assets/img/Alcudia-$img-1280.webp"
        magick $source -strip -quality 60 -resize 400 "assets/img/Alcudia-$img-400.avif"
        magick $source -strip -quality 60 -resize 800 "assets/img/Alcudia-$img-800.avif"
        magick $source -strip -quality 60 -resize 1280 "assets/img/Alcudia-$img-1280.avif"
        magick $source -strip -quality 70 -resize 150 "assets/img/Alcudia-$img-thumb.jpg"
    }
}

foreach ($img in $pollencaImages) {
    $source = "assets/ImaganesVideosPropios/$img.jpeg"
    if (Test-Path $source) {
        Write-Host "Pollenca: $img"
        magick $source -strip -quality 75 -resize 400 "assets/img/Pollenca-$img-400.jpg"
        magick $source -strip -quality 75 -resize 800 "assets/img/Pollenca-$img-800.jpg"
        magick $source -strip -quality 75 -resize 1280 "assets/img/Pollenca-$img-1280.jpg"
        magick $source -strip -quality 80 -resize 400 "assets/img/Pollenca-$img-400.webp"
        magick $source -strip -quality 80 -resize 800 "assets/img/Pollenca-$img-800.webp"
        magick $source -strip -quality 80 -resize 1280 "assets/img/Pollenca-$img-1280.webp"
        magick $source -strip -quality 60 -resize 400 "assets/img/Pollenca-$img-400.avif"
        magick $source -strip -quality 60 -resize 800 "assets/img/Pollenca-$img-800.avif"
        magick $source -strip -quality 60 -resize 1280 "assets/img/Pollenca-$img-1280.avif"
        magick $source -strip -quality 70 -resize 150 "assets/img/Pollenca-$img-thumb.jpg"
    }
}

Write-Host "OK: Imagenes procesadas" -ForegroundColor Green

# ============================================================================
# PARTE 2: PROCESAR VIDEOS
# ============================================================================

Write-Host "`n===== PROCESANDO VIDEOS =====" -ForegroundColor Cyan

$alcudiaVideos = @('alcudia1','alcudia2','alcudia3','alcudia4')
foreach ($vid in $alcudiaVideos) {
    $source = "assets/ImaganesVideosPropios/$vid.mp4"
    if (Test-Path $source) {
        Write-Host "Alcudia video: $vid"
        ffmpeg -i $source -vf "scale=1280:720" -c:v libx264 -preset medium -b:v 2000k -c:a aac -b:a 128k -y "assets/videos/Alcudia-$vid-720p.mp4" 2>$null
        ffmpeg -i $source -vf "scale=854:480" -c:v libx264 -preset medium -b:v 1000k -c:a aac -b:a 96k -y "assets/videos/Alcudia-$vid-480p.mp4" 2>$null
        ffmpeg -i $source -vf "scale=1280:720" -c:v libvpx-vp9 -b:v 1500k -c:a libopus -b:a 128k -y "assets/videos/Alcudia-$vid-720p.webm" 2>$null
    }
}

$pollencaVideos = @('pollenca1','pollenca2','pollenca3')
foreach ($vid in $pollencaVideos) {
    $source = "assets/ImaganesVideosPropios/$vid.mov"
    if (Test-Path $source) {
        Write-Host "Pollenca video: $vid"
        ffmpeg -i $source -vf "scale=1280:720" -c:v libx264 -preset medium -b:v 2000k -c:a aac -b:a 128k -y "assets/videos/Pollenca-$vid-720p.mp4" 2>$null
        ffmpeg -i $source -vf "scale=854:480" -c:v libx264 -preset medium -b:v 1000k -c:a aac -b:a 96k -y "assets/videos/Pollenca-$vid-480p.mp4" 2>$null
        ffmpeg -i $source -vf "scale=1280:720" -c:v libvpx-vp9 -b:v 1500k -c:a libopus -b:a 128k -y "assets/videos/Pollenca-$vid-720p.webm" 2>$null
    }
}

Write-Host "OK: Videos procesados" -ForegroundColor Green

# ============================================================================
# PARTE 3: PROCESAR AUDIO
# ============================================================================

Write-Host "`n===== PROCESANDO AUDIO =====" -ForegroundColor Cyan

$audioFiles = @(
    @{name='audioAlcudia'; city='Alcudia'},
    @{name='audioPalma'; city='Palma'}
)

foreach ($audio in $audioFiles) {
    $source = "assets/ImaganesVideosPropios/$($audio.name).m4a"
    if (Test-Path $source) {
        Write-Host "Audio: $($audio.name)"
        ffmpeg -i $source -codec:a libmp3lame -b:a 192k -y "assets/audio/$($audio.city)-audio-192k.mp3" 2>$null
        ffmpeg -i $source -codec:a libmp3lame -b:a 128k -y "assets/audio/$($audio.city)-audio-128k.mp3" 2>$null
        ffmpeg -i $source -codec:a libvorbis -b:a 128k -y "assets/audio/$($audio.city)-audio.ogg" 2>$null
    }
}

Write-Host "OK: Audio procesado" -ForegroundColor Green

Write-Host "`n===== COMPLETADO =====" -ForegroundColor Green
