#!/bin/bash

# Cria os diretórios necessários
mkdir -p public

# Se o Inkscape estiver instalado, gera os ícones a partir do SVG
if command -v inkscape &> /dev/null; then
  # Gera o favicon.ico
  inkscape -w 64 -h 64 -o public/favicon.ico public/favicon.svg
  
  # Gera os ícones para navegadores modernos
  inkscape -w 32 -h 32 -o public/favicon-32x32.png public/favicon.svg
  inkscape -w 16 -h 16 -o public/favicon-16x16.png public/favicon.svg
  
  # Gera o ícone para iOS
  inkscape -w 180 -h 180 -o public/apple-touch-icon.png public/favicon.svg
  
  # Gera os ícones para Android
  inkscape -w 192 -h 192 -o public/android-chrome-192x192.png public/favicon.svg
  inkscape -w 512 -h 512 -o public/android-chrome-512x512.png public/favicon.svg
  
  echo "Ícones gerados com sucesso usando o Inkscape!"
else
  # Se o Inkscape não estiver instalado, copia o SVG para os outros formatos
  cp public/favicon.svg public/favicon.ico
  cp public/favicon.svg public/favicon-32x32.png
  cp public/favicon.svg public/favicon-16x16.png
  cp public/favicon.svg public/apple-touch-icon.png
  cp public/favicon.svg public/android-chrome-192x192.png
  cp public/favicon.svg public/android-chrome-512x512.png
  
  echo "Inkscape não encontrado. Arquivos SVG copiados como placeholders."
  echo "Para obter ícones em alta qualidade, instale o Inkscape e execute este script novamente."
fi

echo "Favicons configurados com sucesso!"
