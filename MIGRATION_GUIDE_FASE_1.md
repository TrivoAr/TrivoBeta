# Guía de Migración - Fase 1: BaseRepository e ImageService

## 🎯 **Cambios Implementados**

### ✅ **1. BaseRepository Pattern**

- Nuevo sistema de repositorios con manejo unificado de errores
- Operaciones CRUD estandarizadas con verificación de propiedad
- Abstracción de conexiones a base de datos
- Manejo consistente de errores con tipos específicos

### ✅ **2. ImageService Unificado**

- Servicio centralizado para todas las operaciones de imágenes
- Manejo automático de timeouts y reintentos
- Generación automática de avatares de fallback
- Validación de archivos de imagen

### ✅ **3. Repositorios Específicos**

- `SalidaSocialRepository` - Para eventos sociales
- `TeamSocialRepository` - Para eventos de equipo
- `AcademiaRepository` - Para academias

---

## 🚀 **Cómo Migrar tu Código**

### **API Routes - Antes vs Después**

#### **ANTES (Patrón Antiguo):**

```typescript
// ❌ Código antiguo con mucha repetición
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const salida = await SalidaSocial.findById(params.id)
      .populate("creador_id")
      .populate("profesorId")
      .populate("sponsors");

    if (!salida) {
      return NextResponse.json(
        { message: "Salida no encontrada" },
        { status: 404 }
      );
    }

    // Lógica compleja para manejar imágenes...
    let imagenUrl;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Image fetch timeout")), 3000)
      );
      imagenUrl = await Promise.race([
        getProfileImage("profile-image.jpg", salida.creador_id._id.toString()),
        timeoutPromise,
      ]);
    } catch (error) {
      imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        salida.creador_id.firstname
      )}&length=1&background=random&color=fff&size=128`;
    }

    // Más código repetitivo...

    return NextResponse.json(salidaObj, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
```

#### **DESPUÉS (Patrón Nuevo):**

```typescript
// ✅ Código nuevo, limpio y reutilizable
import { SalidaSocialRepository, NotFoundError } from "@/libs/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = new SalidaSocialRepository();
    const salida = await repository.findWithPopulatedData(params.id);

    return NextResponse.json(salida, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

### **Operaciones CRUD - Antes vs Después**

#### **ANTES (Update con verificación manual):**

```typescript
// ❌ Código repetitivo para verificar propiedad
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await SalidaSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json(
      { message: "Salida no encontrada" },
      { status: 404 }
    );
  }

  if (salida.creador_id.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso" }, { status: 403 });
  }

  const data = await req.json();

  try {
    const actualizada = await SalidaSocial.findByIdAndUpdate(params.id, data, {
      new: true,
    });
    return NextResponse.json(actualizada, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al actualizar" },
      { status: 500 }
    );
  }
}
```

#### **DESPUÉS (Update automático con verificación):**

```typescript
// ✅ Una sola línea hace toda la verificación
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const repository = new SalidaSocialRepository();

    const actualizada = await repository.updateWithOwnerCheck(
      params.id,
      data,
      session.user.id
    );

    return NextResponse.json(actualizada, { status: 200 });
  } catch (error) {
    // Manejo automático de errores tipados
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Error al actualizar" },
      { status: 500 }
    );
  }
}
```

### **Manejo de Imágenes - Antes vs Después**

#### **ANTES (Funciones separadas):**

```typescript
// ❌ Funciones dispersas sin consistencia
import { saveSocialImage } from "@/app/api/social/saveSocialImage";
import { saveTeamSocialImage } from "@/app/api/team-social/saveTeamSocialImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

// Código repetitivo en cada lugar...
```

#### **DESPUÉS (Servicio unificado):**

```typescript
// ✅ Un solo servicio para todo
import { ImageService } from "@/libs/services/ImageService";

// Subir imágenes
const socialImageUrl = await ImageService.saveSocialImage(file, salidaId);
const teamImageUrl = await ImageService.saveTeamSocialImage(file, teamId);
const academyImageUrl = await ImageService.saveAcademyImage(file, academyId);

// Obtener imágenes con fallback automático
const profileImage = await ImageService.getProfileImageWithFallback(
  userId,
  userName
);

// Generar avatares
const avatarUrl = ImageService.generateAvatarUrl("Juan Pérez");

// Validar archivos
const validation = ImageService.validateImageFile(file);
if (!validation.isValid) {
  throw new Error(validation.error);
}
```

---

## 📚 **Nuevas APIs Disponibles**

### **BaseRepository Methods:**

```typescript
// Operaciones básicas
await repository.findById(id, populate);
await repository.findByIdOrThrow(id);
await repository.create(data);
await repository.findMany(filters, options);

// Operaciones con verificación de propiedad
await repository.findByIdWithOwnerCheck(id, ownerId);
await repository.updateWithOwnerCheck(id, data, ownerId);
await repository.deleteWithOwnerCheck(id, ownerId);

// Utilidades
await repository.count(filters);
await repository.exists(filters);
```

### **SalidaSocialRepository Methods:**

```typescript
const repo = new SalidaSocialRepository();

// Métodos específicos
await repo.findWithPopulatedData(id);
await repo.findWithFilters(filters, options);
await repo.findByCreator(creatorId);
await repo.findUpcoming();
await repo.findNearby(lat, lng, radiusInKm);
await repo.getCreatorStats(creatorId);

// Con imágenes
await repo.createWithImage(eventData, imageFile);
await repo.updateWithImage(id, data, ownerId, imageFile);
```

### **ImageService Methods:**

```typescript
// Subida de imágenes
await ImageService.uploadImage(file, path, fileName, options);
await ImageService.saveSocialImage(file, salidaId);
await ImageService.saveTeamSocialImage(file, teamId);
await ImageService.saveAcademyImage(file, academyId);

// Obtener imágenes
await ImageService.getImageUrl(path, fileName);
await ImageService.getProfileImageWithFallback(userId, userName);

// Utilidades
ImageService.generateAvatarUrl(name, options);
ImageService.validateImageFile(file, options);
```

---

## 🛠️ **Factory Pattern para Repositorios**

```typescript
import { RepositoryFactory } from "@/libs/repository";

// Obtener repositorios
const socialRepo = RepositoryFactory.getSalidaSocialRepository();
const teamRepo = RepositoryFactory.getTeamSocialRepository();
const academyRepo = RepositoryFactory.getAcademiaRepository();

// Por tipo
const repo = RepositoryFactory.getRepository("social"); // 'team-social' | 'academia'
```

---

## 🔄 **Compatibilidad hacia Atrás**

Las funciones antiguas **siguen funcionando** pero ahora usan internamente los nuevos servicios:

```typescript
// ✅ Funciona igual que antes (pero internamente usa ImageService)
import { saveSocialImage } from "@/app/api/social/saveSocialImage";

// ⚠️ Marcado como deprecated, migra cuando puedas
const url = await saveSocialImage(file, salidaId);
```

---

## 🎯 **Beneficios Inmediatos**

1. **Reducción de código**: ~70% menos líneas en API routes
2. **Manejo consistente de errores**: Errores tipados y mensajes uniformes
3. **Mejor mantenibilidad**: Lógica centralizada
4. **Mayor robustez**: Timeouts, reintentos y fallbacks automáticos
5. **Mejor testabilidad**: Servicios aislados y mocking más fácil

---

## 📋 **Próximos Pasos**

1. **Migra gradualmente** tus API routes existentes
2. **Usa los nuevos repositorios** en nuevas funcionalidades
3. **Elimina imports deprecated** cuando sea conveniente
4. **Aprovecha el manejo de errores** tipado

---

## 🚨 **Notas Importantes**

- Las funciones antiguas **NO se eliminarán** hasta avisar
- Los nuevos servicios son **completamente compatibles**
- **No hay breaking changes** en esta fase
- **Migración gradual recomendada**

¡La Fase 1 está lista! 🎉
