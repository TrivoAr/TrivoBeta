# Checklist de Variables de Entorno para Vercel - MercadoPago

## 🚨 Variables CRÍTICAS para que MercadoPago Funcione

Estas variables **DEBEN** estar configuradas en Vercel para que el botón de pago funcione:

### 1. ✅ MERCADOPAGO_ACCESS_TOKEN (o MP_ACCESS_TOKEN)
**Ubicación en Vercel**: Settings → Environment Variables

```
Nombre: MERCADOPAGO_ACCESS_TOKEN
Valor: APP_USR-4970861093465590-010315-67d54047f2b166ed4a4b294ad01bf781-2190675569
Ambientes: ✅ Production, ✅ Preview, ✅ Development
```

**⚠️ IMPORTANTE**: El código soporta ambos nombres:
- `MERCADOPAGO_ACCESS_TOKEN` (recomendado)
- `MP_ACCESS_TOKEN` (alternativo)

### 2. ✅ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
**Ubicación en Vercel**: Settings → Environment Variables

```
Nombre: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
Valor: APP_USR-366c753d-bfc0-4863-b3dc-9103cbcf8bc0
Ambientes: ✅ Production, ✅ Preview, ✅ Development
```

**⚠️ CRÍTICO**: Debe empezar con `NEXT_PUBLIC_` para que esté disponible en el frontend.

## 📋 Variables RECOMENDADAS (Opcionales pero mejoran seguridad)

### 3. 🔄 NEXT_PUBLIC_BASE_URL
**Ubicación en Vercel**: Settings → Environment Variables

```
Nombre: NEXT_PUBLIC_BASE_URL
Valor: https://trivo.com.ar
Ambientes: ✅ Production
```

**Nota**: Si no está configurada, el sistema usará fallback automático desde el request.
Para Preview/Development, puede quedar vacía o usar las URLs de Vercel.

### 4. 🔒 MERCADOPAGO_WEBHOOK_SECRET
**Ubicación en Vercel**: Settings → Environment Variables

```
Nombre: MERCADOPAGO_WEBHOOK_SECRET
Valor: [Obtener desde dashboard de MercadoPago]
Ambientes: ✅ Production
```

**Nota**: Mejora la seguridad validando que los webhooks vienen de MercadoPago.

## 🔍 Cómo Verificar en Vercel

### Método 1: Dashboard Web
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "Trivo"
3. Ve a **Settings** → **Environment Variables**
4. Verifica que existan las 2 variables críticas
5. Asegúrate que estén marcadas para **Production**

### Método 2: Vercel CLI (si tienes instalado)
```bash
# Ver todas las variables
vercel env ls

# Agregar variable si falta
vercel env add MERCADOPAGO_ACCESS_TOKEN production
```

## 🐛 Diagnóstico de Problemas

### Error 401 Unauthorized persiste después del deploy

**Causa probable**: Variables de entorno no configuradas en Vercel

**Solución**:
1. Verifica en Vercel Dashboard que las variables existan
2. Si acabas de agregarlas, necesitas **redeploy**:
   ```bash
   # Opción A: Desde dashboard → Deployments → ... → Redeploy
   # Opción B: Commit vacío
   git commit --allow-empty -m "chore: redeploy"
   git push origin main
   ```

### Error 500 "Configuración de MercadoPago incompleta"

**Causa**: Falta `MERCADOPAGO_ACCESS_TOKEN` en Vercel

**Solución**: Agregar la variable en Vercel Settings → Environment Variables

### SDK de MercadoPago no carga (ERR_BLOCKED_BY_CLIENT)

**Causa**: Bloqueador de ads o extensión del navegador

**Solución**:
- Probar en modo incógnito
- Desactivar bloqueadores temporalmente
- Usar otro navegador

### Botón de pago no aparece

**Causa**: Falta `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

**Solución**: Agregar la variable con prefijo `NEXT_PUBLIC_` en Vercel

## ✅ Checklist Final

Marca cuando completes cada paso:

- [ ] Variables agregadas en Vercel Dashboard
- [ ] Variables marcadas para ambiente "Production"
- [ ] Deploy completado exitosamente
- [ ] Probado el botón de pago en producción
- [ ] Verificado que no hay errores 401 en consola

## 📞 Si el Problema Persiste

1. **Verificar logs del deployment**:
   - Vercel Dashboard → Deployments → [último deploy] → Function Logs
   - Buscar errores relacionados con "mercadopago" o "401"

2. **Verificar que el endpoint existe**:
   ```bash
   # Debe responder 200 OK (con un GET vacío dará error, pero no 404)
   curl https://trivo.com.ar/api/mercadopago/bricks/preferences
   ```

3. **Revisar commit deployado**:
   - Vercel Dashboard → Deployments → [último deploy]
   - Verificar que el commit incluya el archivo:
     `src/app/api/mercadopago/bricks/preferences/route.ts`

---

**Última actualización**: 2025-11-10
**Estado**: Variables críticas identificadas, pendiente verificación en Vercel
