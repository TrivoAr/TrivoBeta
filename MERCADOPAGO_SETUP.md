# Configuración de MercadoPago - Trivo

## Problema Resuelto

El botón de "Pagar con MercadoPago" estaba fallando con error **401 Unauthorized** debido a:

1. **Endpoint faltante**: El SDK de MercadoPago Bricks (`@mercadopago/sdk-react`) requiere un endpoint `/api/mercadopago/bricks/preferences` para validar la configuración del cliente.

2. **Variables de entorno inconsistentes**: El código buscaba `MP_ACCESS_TOKEN` pero el archivo `.env.local` tenía `MERCADOPAGO_ACCESS_TOKEN`.

3. **URL base no configurada**: Faltaba `NEXT_PUBLIC_BASE_URL` para las URLs de retorno y webhooks.

## Cambios Realizados

### 1. Nuevo Endpoint para SDK Bricks

**Archivo creado**: `src/app/api/mercadopago/bricks/preferences/route.ts`

Este endpoint:
- Valida la configuración de la Public Key de MercadoPago
- Responde a las peticiones GET del SDK para verificar la configuración
- Redirige las peticiones POST al endpoint principal de preferences

### 2. Corrección de Variables de Entorno

**Archivo modificado**: `src/app/api/mercadopago/preferences/route.ts`

Ahora soporta ambos nombres de variables:
```typescript
const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
```

### 3. Fallback para URL Base

Implementado un sistema de fallback para construir la URL base:
```typescript
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  (request.headers.get("host")
    ? `https://${request.headers.get("host")}`
    : "https://trivo.com.ar");
```

## Variables de Entorno Requeridas

### Obligatorias

```env
# Access Token de MercadoPago (puede usar cualquiera de estos nombres)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXX
# O alternativamente:
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXX

# Public Key de MercadoPago (para el SDK frontend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXX
```

### Opcionales (con fallback)

```env
# URL base de la aplicación (para webhooks y URLs de retorno)
NEXT_PUBLIC_BASE_URL=https://trivo.com.ar
# O puede usar NEXTAUTH_URL como alternativa
```

### Para Webhook Security (Recomendado)

```env
# Secret para validar webhooks de MercadoPago
MERCADOPAGO_WEBHOOK_SECRET=tu_secret_aqui
```

## Flujo de Pago Actual

### 1. Pago Directo con MercadoPago ✅ FUNCIONANDO

```
Usuario → Clic "Pagar con MercadoPago"
       ↓
Frontend → POST /api/mercadopago/preferences
       ↓
SDK Bricks → GET /api/mercadopago/bricks/preferences (validación)
       ↓
MercadoPago SDK → Mostrar Wallet Component
       ↓
Usuario completa pago
       ↓
MercadoPago → Webhook /api/mercadopago/webhook
       ↓
Sistema → Aprueba automáticamente, crea ticket, envía email
```

### 2. Transferencia Manual ✅ FUNCIONANDO

```
Usuario → Sube comprobante
       ↓
POST /api/pagos
       ↓
Creador aprueba manualmente
       ↓
PATCH /api/pagos/[id]
       ↓
Sistema → Crea ticket, envía email
```

### 3. Transferencia Automática a CVU ⚠️ DESACTIVADA

Ver documento `PAGOS_AUTOMATICOS_DESACTIVADOS.md` para más información.

## Verificación de Configuración

Para verificar que todo está configurado correctamente:

```bash
# 1. Verificar variables de entorno
grep -E "MERCADOPAGO|MP_" .env.local

# 2. Reiniciar el servidor de desarrollo
npm run dev

# 3. Abrir la consola del navegador y verificar que no hay errores 401
```

## Errores Comunes

### Error 401 Unauthorized en `/bricks/preferences`
**Causa**: Endpoint no existía o Public Key no configurada
**Solución**: ✅ Resuelto con nuevo endpoint

### Error 500 "Configuración de MercadoPago incompleta"
**Causa**: Falta `MERCADOPAGO_ACCESS_TOKEN` o `MP_ACCESS_TOKEN`
**Solución**: Agregar la variable al archivo `.env.local`

### Error "undefined/social/xxx" en URLs de retorno
**Causa**: `NEXT_PUBLIC_BASE_URL` no configurada
**Solución**: ✅ Resuelto con fallback automático, pero se recomienda configurar explícitamente

### ERR_BLOCKED_BY_CLIENT
**Causa**: Bloqueador de ads o extensión del navegador
**Solución**: Desactivar bloqueadores temporalmente o probar en modo incógnito

## Archivos Modificados

1. ✅ **Creado**: `src/app/api/mercadopago/bricks/preferences/route.ts`
2. ✅ **Modificado**: `src/app/api/mercadopago/preferences/route.ts`
   - Soporte para ambos nombres de access token
   - Fallback para URL base

## Próximos Pasos

1. ✅ Testear el flujo de pago completo en desarrollo
2. ⏳ Configurar `NEXT_PUBLIC_BASE_URL` explícitamente en producción
3. ⏳ Agregar `MERCADOPAGO_WEBHOOK_SECRET` para mayor seguridad
4. ⏳ Considerar reactivar el sistema de transferencias automáticas con las mejoras documentadas

## Referencias

- [Documentación MercadoPago SDK React](https://github.com/mercadopago/sdk-react)
- [Documentación Webhooks](./WEBHOOKS_MERCADOPAGO_README.md)
- [Sistema de Pagos Desactivado](./PAGOS_AUTOMATICOS_DESACTIVADOS.md)

---

**Fecha de actualización**: 2025-11-10
**Estado**: Sistema de pagos directos MercadoPago restaurado y funcionando
