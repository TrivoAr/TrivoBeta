# Iconos Placeholder Temporales

Por ahora, los iconos placeholder han sido configurados.

**IMPORTANTE:** Estos son iconos temporales. Debes reemplazarlos con los iconos oficiales de Trivo.

## Cómo Reemplazar

1. Genera los iconos usando las instrucciones en `INSTRUCCIONES_ICONOS_PWA.md`
2. Coloca los archivos PNG en `public/icons/` con los nombres exactos:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

3. Los iconos se actualizarán automáticamente en la próxima build

## Herramienta Rápida

Usa esto para generar desde tu logo:
```bash
npx pwa-asset-generator tu-logo.png ./public/icons --icon-only --favicon --type png
```
