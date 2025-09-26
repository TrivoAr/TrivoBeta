# Guía de Migración - Fase 2: Hooks Personalizados y Componentes Reutilizables

## 🎯 **Cambios Implementados**

### ✅ **1. Hooks Personalizados Reutilizables**

- `useFavorites` - Gestión completa de favoritos con autenticación
- `useMembers` - Manejo de miembros de eventos con tiempo real
- `useAsyncState` - Estado asíncrono genérico con manejo de errores
- `useForm` - Formularios con validación integrada
- `useModal` - Estado de modales simplificado

### ✅ **2. Componentes Base Reutilizables**

- `BaseCard` - Cards flexibles con múltiples variantes
- `BaseModal` - Modales accesibles con focus trap
- `BaseButton` - Botones con estados de carga y variantes
- `BaseInput` - Inputs con validación y estados
- `BaseTextarea` - Área de texto con auto-resize

### ✅ **3. Sistema de Validación Unificado**

- Reglas de validación reutilizables
- Esquemas predefinidos para formularios comunes
- Integración automática con `useForm`
- Validación en tiempo real

### ✅ **4. Patrones de Composición**

- Componentes completamente composables
- Props interfaces consistentes
- Patrones de diseño reutilizables

---

## 🚀 **Antes vs Después: Comparación Práctica**

### **EventCard Component**

#### **ANTES (280 líneas de código repetitivo):**

```tsx
// ❌ Código con mucha lógica duplicada
export default function EventCard({ event }: EventCardProps) {
  const [esFavorito, setEsFavorito] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();

  // 50+ líneas de lógica de favoritos
  const toggleFavorito = async () => {
    if (!session?.user?.id) {
      toast.error("Debes iniciar sesión para agregar a favoritos.");
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await axios.post(`/api/favoritos/sociales/${event._id}`);
      const data = res.data;
      setEsFavorito(data.favorito);
      toast.success(data.favorito ? "Agregado" : "Eliminado");
    } catch (error) {
      toast.error("Error al actualizar favoritos.");
    }
  };

  // 40+ líneas de lógica de miembros
  async function fetchMiembros(salidaId: string) {
    const res = await fetch(`/api/social/miembros/${salidaId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Miembros ${res.status}`);
    }
    return res.json();
  }

  useEffect(() => {
    const loadMiembros = async () => {
      try {
        const data = await fetchMiembros(event._id);
        const miembrosAprobados = data.filter(
          (m: Miembro) =>
            m.estado === "aprobado" || m.pago_id?.estado === "aprobado"
        );
        setMiembros(miembrosAprobados);
      } catch (err) {
        toast.error("No se pudieron cargar los cupos");
      }
    };
    loadMiembros();
  }, [event._id]);

  // Más lógica repetitiva...

  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-white w-[360px]">
      {/* 100+ líneas más de JSX complejo */}
    </div>
  );
}
```

#### **DESPUÉS (80 líneas, lógica reutilizable):**

```tsx
// ✅ Código limpio usando hooks y componentes base
export default function EventCardRefactored({ event }: EventCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Estados de modales con hook
  const loginModal = useModal();
  const eventModal = useModal();

  // Favoritos con hook personalizado (toda la lógica encapsulada)
  const {
    isFavorite,
    isLoading: favoritesLoading,
    toggleFavorite,
  } = useFavorites("sociales", event._id, {
    showLoginModal: loginModal.open,
    onFavoriteChange: (isFav) => console.log("Favorite changed:", isFav),
  });

  // Miembros con hook personalizado (auto-refresh incluido)
  const {
    memberCount,
    availableSpots,
    isLoading: membersLoading,
  } = useMembers(event._id, "social", {
    onlyApproved: true,
    refreshInterval: 30000, // Auto-refresh cada 30 segundos
  });

  return (
    <BaseCard
      image={event.image}
      imageAlt={event.title}
      variant="elevated"
      clickable
      onClick={() => router.push(`/social/${event._id}`)}
      actions={
        <IconButton
          icon={isFavorite ? <FilledHeartIcon /> : <OutlineHeartIcon />}
          onClick={toggleFavorite}
          loading={favoritesLoading}
          variant="ghost"
        />
      }
    >
      {/* Contenido simplificado */}
    </BaseCard>
  );
}
```

---

## 📚 **Nuevas APIs y Patrones**

### **1. Hooks Personalizados**

#### **useFavorites Hook:**

```tsx
const {
  isFavorite, // Estado actual
  isLoading, // Estado de carga
  error, // Error si existe
  toggleFavorite, // Función para alternar
  refreshFavoriteStatus, // Refrescar estado
} = useFavorites(
  "sociales", // Tipo: 'sociales' | 'academias' | 'teamsocial'
  eventId, // ID del elemento
  {
    showLoginModal: () => setShowLogin(true),
    onFavoriteChange: (isFav, itemId) => {
      analytics.track("favorite_toggled", { itemId, isFavorite: isFav });
    },
  }
);
```

#### **useMembers Hook:**

```tsx
const {
  members, // Lista de miembros
  approvedMembers, // Solo miembros aprobados
  pendingMembers, // Miembros pendientes
  isLoading, // Estado de carga
  memberCount, // Cantidad total
  availableSpots, // Función para calcular cupos disponibles
  refetch, // Refrescar datos
} = useMembers(
  eventId,
  "social", // 'social' | 'team-social'
  {
    onlyApproved: true,
    refreshInterval: 30000, // Auto-refresh cada 30s
    onError: (error) => toast.error(error),
    onMemberUpdate: (members) => analytics.track("members_updated"),
  }
);

// Uso
const spots = availableSpots(totalSpots); // Calcula cupos disponibles
```

#### **useAsyncState Hook:**

```tsx
const {
  data, // Datos actuales
  loading, // Estado de carga
  error, // Error si existe
  execute, // Ejecutar operación async
  setData, // Establecer datos manualmente
  reset, // Resetear estado
  hasData, // Boolean si hay datos
  hasError, // Boolean si hay error
} = useAsyncState<EventType[]>({
  onSuccess: (data) => toast.success(`Loaded ${data.length} events`),
  onError: (error) => toast.error(error),
});

// Uso
const loadEvents = async () => {
  await execute(async () => {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("Failed to load events");
    return response.json();
  });
};
```

#### **useForm Hook:**

```tsx
const form = useForm({
  initialValues: { name: "", email: "", message: "" },
  validation: ValidationSchemas.contactForm,
  onSubmit: async (values, helpers) => {
    try {
      await submitContactForm(values);
      toast.success("Message sent!");
      helpers.resetForm();
    } catch (error) {
      helpers.setFieldError("email", "This email is already registered");
    }
  },
});

// Uso en JSX
<form onSubmit={form.handleSubmit}>
  <BaseInput {...form.getFieldProps("name")} label="Name" />
  <BaseInput {...form.getFieldProps("email")} label="Email" type="email" />
  <BaseTextarea {...form.getFieldProps("message")} label="Message" />

  <BaseButton
    type="submit"
    loading={form.isSubmitting}
    disabled={!form.isValid}
  >
    Send Message
  </BaseButton>
</form>;
```

### **2. Componentes Base**

#### **BaseCard Component:**

```tsx
<BaseCard
  image="/event-image.jpg"
  imageAlt="Event Image"
  title="Event Title"
  subtitle="Event description"
  variant="elevated" // "default" | "bordered" | "elevated" | "flat"
  size="default" // "sm" | "default" | "lg"
  clickable
  onClick={() => router.push("/event/123")}
  badge={<Badge>New</Badge>}
  actions={
    <IconButton
      icon={<HeartIcon />}
      onClick={handleFavorite}
      loading={isLoading}
    />
  }
  footer={
    <div className="flex justify-between">
      <span>Price: $50</span>
      <span>Available: 5</span>
    </div>
  }
>
  <p>Additional content goes here</p>
</BaseCard>
```

#### **BaseButton Component:**

```tsx
// Botón básico
<BaseButton variant="primary" size="lg" onClick={handleSubmit}>
  Save Changes
</BaseButton>

// Botón con íconos y carga
<BaseButton
  variant="primary"
  loading={isSubmitting}
  loadingText="Saving..."
  leftIcon={<SaveIcon />}
  rightIcon={<ArrowIcon />}
  disabled={!isValid}
>
  Save and Continue
</BaseButton>

// Botón de enlace
<LinkButton href="/events" variant="outline">
  View All Events
</LinkButton>

// Botón de ícono
<IconButton
  icon={<TrashIcon />}
  variant="danger"
  size="sm"
  round
  aria-label="Delete item"
  onClick={handleDelete}
/>
```

#### **BaseInput Component:**

```tsx
// Input básico
<BaseInput
  label="Email"
  type="email"
  placeholder="Enter your email"
  required
  error={emailError}
  helperText="We'll never share your email"
/>

// Input con íconos
<BaseInput
  label="Search"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
  loading={isSearching}
/>

// Input con contador de caracteres
<BaseInput
  label="Bio"
  maxLength={280}
  showCharacterCount
  helperText="Tell us about yourself"
/>

// Input de búsqueda especializado
<SearchInput
  placeholder="Search events..."
  onSearch={handleSearch}
  onClear={handleClear}
  searchDelay={500}
/>
```

#### **BaseModal Component:**

```tsx
// Modal básico
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure you want to delete this item?"
  size="sm"
  footer={
    <div className="flex gap-2 justify-end">
      <BaseButton variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </BaseButton>
      <BaseButton variant="danger" onClick={handleDelete}>
        Delete
      </BaseButton>
    </div>
  }
>
  <p>This action cannot be undone.</p>
</BaseModal>

// Modal de confirmación predefinido
<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="Delete Event"
  message="Are you sure you want to delete this event? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  loading={isDeleting}
/>
```

### **3. Sistema de Validación**

#### **Reglas de Validación Predefinidas:**

```tsx
import {
  ValidationRules,
  ValidationSchemas,
  FieldValidations,
} from "@/libs/validation";

// Reglas individuales
const nameValidation = [
  ValidationRules.required(),
  ValidationRules.minLength(2),
  ValidationRules.maxLength(50),
];

const emailValidation = [ValidationRules.required(), ValidationRules.email()];

const passwordValidation = [
  ValidationRules.required(),
  ValidationRules.minLength(8),
  ValidationRules.pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Debe contener al menos una minúscula, una mayúscula y un número"
  ),
];

// Esquemas predefinidos
const userForm = useForm({
  initialValues: { firstname: "", lastname: "", email: "", password: "" },
  validation: ValidationSchemas.userRegistration,
});

const eventForm = useForm({
  initialValues: { nombre: "", fecha: "", hora: "", ubicacion: "", cupo: "" },
  validation: ValidationSchemas.eventCreation,
});
```

#### **Validaciones Personalizadas:**

```tsx
// Validación personalizada
const customValidation = ValidationRules.custom((value, formData) => {
  // Validar que la fecha de fin sea posterior a la de inicio
  return new Date(value) > new Date(formData.startDate);
}, "La fecha de fin debe ser posterior a la de inicio");

// Validación de archivo de imagen
const imageValidation = [
  ValidationRules.fileType(["image/jpeg", "image/png"], "Solo JPG y PNG"),
  ValidationRules.fileSize(5, "Máximo 5MB"),
];
```

---

## 🔄 **Guía de Migración Paso a Paso**

### **Paso 1: Identificar Patrones Repetitivos**

```bash
# Buscar componentes que usan lógica similar
grep -r "useState.*favorito" src/components/
grep -r "fetch.*miembros" src/components/
grep -r "axios.post.*favoritos" src/components/
```

### **Paso 2: Migrar Estado a Hooks**

```tsx
// ❌ Antes
const [esFavorito, setEsFavorito] = useState(false);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  const checkFavorito = async () => {
    // 20+ líneas de lógica...
  };
  checkFavorito();
}, [eventId]);

// ✅ Después
const { isFavorite, isLoading, toggleFavorite } = useFavorites(
  "sociales",
  eventId
);
```

### **Paso 3: Reemplazar UI con Componentes Base**

```tsx
// ❌ Antes
<div className="rounded-2xl overflow-hidden shadow-md bg-white w-[360px]">
  <div className="relative w-full h-[180px]" style={{ backgroundImage: `url(${image})` }}>
    <button className="btnFondo absolute top-2 right-5" onClick={toggleFavorito}>
      {/* Ícono complejo */}
    </button>
  </div>
  <div className="p-4">
    <h2 className="font-bold text-md">{title}</h2>
    {/* Más JSX complejo */}
  </div>
</div>

// ✅ Después
<BaseCard
  image={image}
  title={title}
  variant="elevated"
  clickable
  actions={
    <IconButton
      icon={<HeartIcon />}
      onClick={toggleFavorite}
      loading={isLoading}
    />
  }
>
  {/* Contenido simplificado */}
</BaseCard>
```

### **Paso 4: Migrar Formularios**

```tsx
// ❌ Antes
const [formData, setFormData] = useState({ name: "", email: "" });
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Validación manual
  const newErrors = {};
  if (!formData.name) newErrors.name = "Name is required";
  if (!formData.email) newErrors.email = "Email is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setIsSubmitting(false);
    return;
  }

  try {
    await submitForm(formData);
  } catch (error) {
    // Manejo de errores...
  } finally {
    setIsSubmitting(false);
  }
};

// ✅ Después
const form = useForm({
  initialValues: { name: "", email: "" },
  validation: {
    name: { rules: [ValidationRules.required()], value: "" },
    email: {
      rules: [ValidationRules.required(), ValidationRules.email()],
      value: "",
    },
  },
  onSubmit: async (values) => {
    await submitForm(values);
  },
});
```

---

## 📊 **Beneficios Medidos**

### **Reducción de Código:**

- **EventCard**: 280 líneas → 80 líneas (**71% reducción**)
- **Lógica de favoritos**: Reutilizable en todos los componentes
- **Manejo de estado**: Consistente y predecible

### **Mejoras en Mantenibilidad:**

- **Lógica centralizada**: Bugs se arreglan una vez para todos los componentes
- **Testing más fácil**: Hooks aislados y testeable independientemente
- **Consistencia UI**: Todos los componentes usan la misma base

### **Nuevas Funcionalidades Automáticas:**

- **Auto-refresh** en listas de miembros
- **Estados de carga** en todas las interacciones
- **Manejo de errores** unificado
- **Validación en tiempo real** en formularios
- **Accesibilidad** integrada en todos los componentes

---

## 🚀 **Próximos Pasos**

Con la Fase 2 completada, puedes:

1. **Migrar componentes existentes** gradualmente
2. **Crear nuevos componentes** usando los patterns establecidos
3. **Implementar nuevas funcionalidades** más rápido
4. **Mantener consistencia** en toda la aplicación

### **Componentes Prioritarios para Migrar:**

1. `Dashboard/DashboardCard.tsx` → Usar `BaseCard`
2. `Modals/LoginModal.tsx` → Usar `BaseModal`
3. Formularios de creación → Usar `useForm` + `BaseInput`
4. Listas de eventos → Usar `useFavorites` + `useMembers`

La **Fase 3** implementará middleware de autorización y ApiHandler para completar la arquitectura! 🎯
