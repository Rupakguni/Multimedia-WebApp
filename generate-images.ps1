# Genera variantes responsive y formatos WebP/AVIF con ImageMagick
# Ejecutar desde la raíz del proyecto: .\generate-images.ps1

$images = @('Palma','Manacor','Inca','Soller','Alcudia','Llucmajor')

foreach ($name in $images) {
    $source = "assets/img/$name.jpg"
    if (-Not (Test-Path $source)) {
        Write-Warning "Archivo no encontrado: $source"
        continue
    }

    Write-Host "Procesando $name..."
    magick $source -strip -resize 640 "assets/img/$name-640.jpg"
    magick $source -strip -resize 1280 "assets/img/$name-1280.jpg"
    magick $source -strip -resize 1920 "assets/img/$name-1920.jpg"

    magick $source -strip -quality 80 -resize 640 "assets/img/$name-640.webp"
    magick $source -strip -quality 80 -resize 1280 "assets/img/$name-1280.webp"
    magick $source -strip -quality 80 -resize 1920 "assets/img/$name-1920.webp"

    magick $source -strip -quality 60 -resize 640 "assets/img/$name-640.avif"
    magick $source -strip -quality 60 -resize 1280 "assets/img/$name-1280.avif"
    magick $source -strip -quality 60 -resize 1920 "assets/img/$name-1920.avif"

    magick $source -strip -resize 320 "assets/img/portfolio/thumbnails/$name-thumb.jpg"
    magick $source -strip -quality 80 -resize 320 "assets/img/portfolio/thumbnails/$name-thumb.webp"
    magick $source -strip -quality 60 -resize 320 "assets/img/portfolio/thumbnails/$name-thumb.avif"
}

Write-Host "Procesamiento completado."