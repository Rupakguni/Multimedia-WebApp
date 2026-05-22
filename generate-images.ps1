# Genera variantes responsive y formatos WebP/AVIF con ImageMagick
# Ejecutar desde la raíz del proyecto: .\generate-images.ps1

$images = @('Palma','Manacor','Inca','Soller','Alcudia','Llucmajor','Pollenca')

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

# Procesar imagen masthead por separado
$mastheadSource = "assets/img/mallorca-masthead.jpg"
if (Test-Path $mastheadSource) {
    Write-Host "Procesando mallorca-masthead..."
    magick $mastheadSource -strip -resize 640 "assets/img/mallorca-masthead-640.jpg"
    magick $mastheadSource -strip -resize 1280 "assets/img/mallorca-masthead-1280.jpg"
    magick $mastheadSource -strip -resize 1920 "assets/img/mallorca-masthead-1920.jpg"

    magick $mastheadSource -strip -quality 80 -resize 640 "assets/img/mallorca-masthead-640.webp"
    magick $mastheadSource -strip -quality 80 -resize 1280 "assets/img/mallorca-masthead-1280.webp"
    magick $mastheadSource -strip -quality 80 -resize 1920 "assets/img/mallorca-masthead-1920.webp"

    magick $mastheadSource -strip -quality 60 -resize 640 "assets/img/mallorca-masthead-640.avif"
    magick $mastheadSource -strip -quality 60 -resize 1280 "assets/img/mallorca-masthead-1280.avif"
    magick $mastheadSource -strip -quality 60 -resize 1920 "assets/img/mallorca-masthead-1920.avif"
} else {
    Write-Warning "Archivo no encontrado: $mastheadSource"
}

# Procesar imágenes de galería (variantes de portfolio)
$galleryImages = Get-ChildItem "assets/img/*-gallery-*.jpg" -ErrorAction SilentlyContinue
foreach ($galleryFile in $galleryImages) {
    $baseName = $galleryFile.BaseName
    $source = $galleryFile.FullName
    
    Write-Host "Procesando galería: $baseName..."
    
    # Generar thumbnails (400px para cards)
    magick "$source" -strip -resize 400 "assets/img/portfolio/thumbnails/$baseName-thumb.jpg"
    magick "$source" -strip -quality 80 -resize 400 "assets/img/portfolio/thumbnails/$baseName-thumb.webp"
    magick "$source" -strip -quality 60 -resize 400 "assets/img/portfolio/thumbnails/$baseName-thumb.avif"
    
    # Generar versiones medianas (800px para detalles)
    magick "$source" -strip -resize 800 "assets/img/$baseName-800.jpg"
    magick "$source" -strip -quality 80 -resize 800 "assets/img/$baseName-800.webp"
    magick "$source" -strip -quality 60 -resize 800 "assets/img/$baseName-800.avif"
}

Write-Host "Procesamiento completado."