# Procesa las imágenes propias de ImaganesVideosPropios y las copia a assets/img
# Ejecutar desde la raíz del proyecto: .\process-own-images.ps1

Write-Host "Procesando imágenes propias de Pollença..."

# Pollença - 8 imágenes
$pollencaImages = @(
    'pollenca1', 'pollenca2', 'pollenca3', 'pollenca4',
    'pollenca5', 'pollenca6', 'pollenca7', 'pollenca8'
)

foreach ($name in $pollencaImages) {
    # Buscar fuente (puede ser .jpeg o .jpg)
    $sourceJpeg = "assets/ImaganesVideosPropios/$name.jpeg"
    $sourceJpg = "assets/ImaganesVideosPropios/$name.jpg"
    
    $source = $null
    if (Test-Path $sourceJpeg) {
        $source = $sourceJpeg
    } elseif (Test-Path $sourceJpg) {
        $source = $sourceJpg
    }
    
    if (-Not $source) {
        Write-Warning "Archivo no encontrado para $name"
        continue
    }
    
    Write-Host "Procesando Pollença: $name..."
    
    # Generar 400px (thumbnail)
    magick $source -strip -resize 400 "assets/img/Pollenca-${name}-400.jpg"
    magick $source -strip -quality 80 -resize 400 "assets/img/Pollenca-${name}-400.webp"
    
    # Generar 800px (medium)
    magick $source -strip -resize 800 "assets/img/Pollenca-${name}-800.jpg"
    magick $source -strip -quality 80 -resize 800 "assets/img/Pollenca-${name}-800.webp"
    
    # Generar 1280px (large)
    magick $source -strip -resize 1280 "assets/img/Pollenca-${name}-1280.jpg"
    magick $source -strip -quality 80 -resize 1280 "assets/img/Pollenca-${name}-1280.webp"
}

Write-Host "Procesando imágenes propias de Alcúdia..."

# Alcúdia - 9 imágenes (si existen)
$alcudiaImages = @(
    'alcudia1', 'alcudia2', 'alcudia3', 'alcudia4', 'alcudia5',
    'alcudia6', 'alcudia7', 'alcudia8', 'alcudia9'
)

foreach ($name in $alcudiaImages) {
    # Buscar fuente (puede ser .jpeg o .jpg)
    $sourceJpeg = "assets/ImaganesVideosPropios/$name.jpeg"
    $sourceJpg = "assets/ImaganesVideosPropios/$name.jpg"
    
    $source = $null
    if (Test-Path $sourceJpeg) {
        $source = $sourceJpeg
    } elseif (Test-Path $sourceJpg) {
        $source = $sourceJpg
    }
    
    if (-Not $source) {
        # No es error fatal para Alcúdia, algunos pueden no existir
        continue
    }
    
    Write-Host "Procesando Alcúdia: $name..."
    
    # Generar 400px (thumbnail)
    magick $source -strip -resize 400 "assets/img/Alcudia-${name}-400.jpg"
    magick $source -strip -quality 80 -resize 400 "assets/img/Alcudia-${name}-400.webp"
    
    # Generar 800px (medium)
    magick $source -strip -resize 800 "assets/img/Alcudia-${name}-800.jpg"
    magick $source -strip -quality 80 -resize 800 "assets/img/Alcudia-${name}-800.webp"
    
    # Generar 1280px (large)
    magick $source -strip -resize 1280 "assets/img/Alcudia-${name}-1280.jpg"
    magick $source -strip -quality 80 -resize 1280 "assets/img/Alcudia-${name}-1280.webp"
}

Write-Host "Procesamiento completado."
