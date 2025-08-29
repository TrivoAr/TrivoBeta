// "use client";

// import { useRouter } from "next/navigation";
// import { useEffect, useState, useMemo } from "react";
// import { useSession } from "next-auth/react";
// import dynamic from "next/dynamic";
// import toast, { Toaster } from "react-hot-toast";
// import debounce from "lodash.debounce";
// import { confirmActionToast } from "@/app/utils/confirmActionToast";

// interface LatLng {
//   lat: number;
//   lng: number;
// }

// interface Salida {
//   nombre: string;
//   descripcion: string;
//   lat: number;
//   lng: number;
// }

// export default function EditarSalida({ params }: { params: { id: string } }) {
//   const { data: session } = useSession();
//   const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
//     null
//   );
//   const [suggestions, setSuggestions] = useState<any[]>([]);
//   const router = useRouter();
//   const [query, setQuery] = useState("");
//   const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
//     ssr: false,
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [formData, setFormData] = useState({
//     nombre: "",
//     descripcion: "",
//     deporte: "",
//     fecha: "",
//     hora: "",
//     ubicacion: "",
//     localidad: "",
//     whatsappLink: "",
//     telefonoOrganizador: "",
//     imagen: "",
//     locationCoords: { lat: 0, lng: 0 },
//   });

//   const [markerPos, setMarkerPos] = useState<LatLng>({ lat: 0, lng: 0 });
//   const defaultCoords = { lat: -26.8333, lng: -65.2167 };

//   useEffect(() => {
//   toast.promise(
//     fetch(`/api/social/${params.id}`).then((res) => res.json()).then((data) => {
//       setFormData(data);
//       setMarkerPos(data.locationCoords || defaultCoords);
//     }),
//     {
//       loading: "Cargando datos de la salida...",
//       success: "Datos cargados con éxito",
//       error: "Error al cargar los datos",
//     }
//   );
// }, [params.id]);

//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({ ...prevData, [name]: value }));
//     if (name === "ubicacion") {
//       // Debounce
//       if (typingTimeout) clearTimeout(typingTimeout);
//       const timeout = setTimeout(() => {
//         fetchSuggestions(value);
//       }, 500);
//       setTypingTimeout(timeout);
//     }
//   };

//   const fetchSuggestions = async (query: string) => {
//     if (!query) {
//       setSuggestions([]);
//       return;
//     }

//     try {
//       const res = await fetch(
//         `/api/search?q=${encodeURIComponent(formData.ubicacion)}`
//       );
//       const data = await res.json();
//       setSuggestions(data);
//     } catch (err) {
//       console.error("Error buscando sugerencias:", err);
//     }
//   };

//   const handleCoordsChange = async (coords: LatLng) => {
//     setMarkerPos(coords);

//     const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);

//     setFormData((prev) => ({
//       ...prev,
//       ubicacion: direccion || prev.ubicacion,
//       lat: coords.lat,
//       lng: coords.lng,
//       locationCoords: coords,
//     }));
//   };

//   const handleSuggestionClick = (suggestion: any) => {
//     const coords = {
//       lat: parseFloat(suggestion.lat),
//       lng: parseFloat(suggestion.lon),
//     };
//     setFormData((prev) => ({
//       ...prev,
//       ubicacion: suggestion.display_name,
//       lat: coords.lat,
//       lng: coords.lng,
//     }));
//     setMarkerPos(coords); // 👈 Esto hace que el mapa se actualice
//     setSuggestions([]);
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData((prevData) => ({
//           ...prevData,
//           imagen: reader.result as string,
//         }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     await fetch(`/api/social/${params.id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         ...formData,
//         lat: markerPos.lat,
//         lng: markerPos.lng,
//         locationCoords: markerPos,
//       }),
//     });
//     toast.success("Salida Actualizada");
//     router.push("/dashboard");
//   };

//   const handleDelete = async () => {
//     // const confirm = window.confirm(
//     //   "¿Estás seguro que querés eliminar esta salida?"
//     // );
//     // if (!confirm) return;

//     // await fetch(`/api/social/${params.id}`, { method: "DELETE" });
//     // router.push("/dashboard");

//     confirmActionToast({
//       message: "¿Eliminar grupo?",
//       description: "Esta acción no se puede deshacer.",
//       confirmText: "Sí, eliminar",
//       cancelText: "Cancelar",
//       loadingMessage: "Eliminando grupo...",
//       successMessage: "Salida eliminada con éxito",
//       errorMessage: "No se pudo eliminar el grupo",
//       onConfirm: async () => {
//         await fetch(`/api/social/${params.id}`, { method: "DELETE" });
//         setTimeout(() => {
//           router.push("/dashboard");
//         }, 200);
//       },
//     });
//   };

//   const fetchAddressFromCoords = async (lat: number, lon: number) => {
//     try {
//       const res = await fetch(`/api/search/reverse?lat=${lat}&lon=${lon}`);
//       const data = await res.json();
//       return data.display_name as string;
//     } catch (error) {
//       console.error("Error al obtener dirección inversa:", error);
//       return "";
//     }
//   };

//   const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 500), []);

//   useEffect(() => {
//     if (query.length < 3) {
//       setSuggestions([]);
//       return;
//     }
//     debouncedFetch(query);
//   }, [query, debouncedFetch]);

//   // Cleanup para evitar memory leaks
//   useEffect(() => {
//     return () => {
//       debouncedFetch.cancel();
//     };
//   }, [debouncedFetch]);

//   return (
//     <div className="flex flex-col justify-center items-center bg-[#FEFBF9] mb-[150px]">
//       <button
//         onClick={() => router.back()}
//         className="text-[#C76C01] self-start bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center ml-5 mt-5"
//       >
//         <img
//           src="/assets/icons/Collapse Arrow.svg"
//           alt="callback"
//           className="h-[20px] w-[20px]"
//         />
//       </button>
//       <form
//         onSubmit={handleSubmit}
//         className="w-full max-w-md rounded-2xl h-[900px] p-8 mb-4"
//       >
//         <div className="mb-4 flex justify-center items-center relative">
//           <h1 className="text-center font-normal text-2xl">Editar salida</h1>
//         </div>

//         <div className="space-y-4">
//           <input
//             type="text"
//             name="nombre"
//             placeholder="Título"
//             value={formData.nombre}
//             onChange={handleChange}
//             required
//             className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//           />

//           <textarea
//             name="descripcion"
//             placeholder="Descripción"
//             value={formData.descripcion}
//             onChange={handleChange}
//             required
//             className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//           />

//           <select
//             name="localidad"
//             value={formData.localidad}
//             onChange={handleChange}
//             className="w-full p-4  border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//           >
//             <option value="">Localidad</option>
//             <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
//             <option value="Yerba Buena">Yerba Buena</option>
//             <option value="Tafi Viejo">Tafi Viejo</option>
//             <option value="Otros">Otros</option>
//           </select>

//           <select
//             name="deporte"
//             value={formData.deporte}
//             onChange={handleChange}
//             className="w-full p-4  border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//           >
//             <option value="Running">Running</option>
//             <option value="Ciclismo">Ciclismo</option>
//             <option value="Trekking">Trekking</option>
//             <option value="Otros">Otros</option>
//           </select>

//           <div className="flex gap-4">
//             <input
//               type="date"
//               name="fecha"
//               value={formData.fecha.split("T")[0]}
//               onChange={handleChange}
//               required
//               className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//             />
//             <input
//               type="time"
//               name="hora"
//               value={formData.hora}
//               onChange={handleChange}
//               required
//               className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//             />
//           </div>

//           <div className="relative">
//             <input
//               type="text"
//               name="ubicacion"
//               placeholder="Ubicación"
//               value={formData.ubicacion}
//               onChange={handleChange}
//               required
//               className="w-full px-4 py-4 border shadow-md rounded-[15px]"
//             />
//             {suggestions.length > 0 && (
//               <ul className="absolute bg-white border rounded-md z-10 w-full max-h-40 overflow-y-auto">
//                 {suggestions.map((s, idx) => (
//                   <li
//                     key={idx}
//                     className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
//                     onClick={() => handleSuggestionClick(s)}
//                   >
//                     {s.display_name}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           <div className="mt-4">
//             <MapWithNoSSR position={markerPos} onChange={handleCoordsChange} />
//           </div>

//           <input
//             type="text"
//             name="telefonoOrganizador"
//             placeholder="+5491123456789"
//             value={formData.telefonoOrganizador}
//             onChange={handleChange}
//             required
//             className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//           />

//           <input
//             type="text"
//             name="whatsappLink"
//             placeholder="https://chat.whatsapp.com/..."
//             value={formData.whatsappLink}
//             onChange={handleChange}
//             required
//             className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
//           />

//           <div>
//             <div className="flex flex-col items-center">
//               {formData.imagen ? (
//                 <img
//                   src={formData.imagen}
//                   alt="Preview"
//                   className="w-full h-48 object-cover rounded-xl cursor-pointer mb-2"
//                   onClick={() => document.getElementById("fileInput")?.click()}
//                 />
//               ) : (
//                 <div
//                   onClick={() => document.getElementById("fileInput")?.click()}
//                   className="w-full h-48 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer text-orange-400 hover:bg-orange-50 transition"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-10 w-10 mb-2"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M3 15a4 4 0 00.88 2.66L5 19h14l1.12-1.34A4 4 0 0021 15V7a4 4 0 00-4-4H7a4 4 0 00-4 4v8z"
//                     />
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 11v6m0 0l3-3m-3 3l-3-3"
//                     />
//                   </svg>
//                   <span>Agregar imagen</span>
//                 </div>
//               )}
//               <input
//                 type="file"
//                 accept="image/*"
//                 id="fileInput"
//                 onChange={handleImageChange}
//                 className="hidden"
//               />
//             </div>
//           </div>

//           <button
//             className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
//             disabled={isSubmitting}
//             type="submit"
//           >
//             {isSubmitting ? "Guardando cambios" : "Guardar cambios"}
//             {isSubmitting && (
//               <svg
//                 className="animate-spin h-5 w-5 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                 ></path>
//               </svg>
//             )}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             className="w-full mt-2 text-red-500 py-3"
//           >
//             Eliminar salida
//           </button>
//         </div>
//       </form>
//       <div className="pb-[300px]"></div>
//     </div>
//   );
// }
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash.debounce";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";

import DescriptionEditor from "@/components/DescriptionEditor";
import DescriptionMarkdown from "@/components/DescriptionMarkdown";

interface LatLng {
  lat: number;
  lng: number;
}

export default function EditarSalida({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [profes, setProfes] = useState<any[]>([]);
  const [profesorSuggestions, setProfesorSuggestions] = useState<any[]>([]);
  const [queryProfesor, setQueryProfesor] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagen, setImagen] = useState<File | null>(null);

  const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
  });

  // --------- FORM STATE (paridad con Crear) ----------
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    precio: "",
    deporte: "",
    fecha: "",
    hora: "",
    duracion: "",
    descripcion: "",
    localidad: "",
    whatsappLink: "",
    dificultad: "",
    telefonoOrganizador: "",
    coords: null as LatLng | null,
    stravaMap: {
      id: "",
      summary_polyline: "",
      polyline: "",
      resource_state: 0,
    },
    cupo: 0,
    detalles: "",
    cbu: "",
    alias: "",
    profesorId: "" as string | undefined,
    imagen: "" as string, // url existente
    locationCoords: { lat: -26.8333, lng: -65.2167 } as LatLng,
  });

  const [markerPos, setMarkerPos] = useState<LatLng>({
    lat: -26.8333,
    lng: -65.2167,
  });

  // --------- LOAD INITIAL DATA ----------
  useEffect(() => {
    toast.promise(
      (async () => {
        const res = await fetch(`/api/social/${params.id}`);
        const data = await res.json();

        // Normalizamos: fecha puede venir ISO, hora puede venir separado
        const fechaStr =
          typeof data.fecha === "string" ? data.fecha.split("T")[0] : "";

        setFormData((prev) => ({
          ...prev,
          ...data,
          fecha: fechaStr || prev.fecha,
          // si el back guarda coords en locationCoords
          coords: data.locationCoords ?? data.coords ?? prev.coords,
          locationCoords:
            data.locationCoords ?? data.coords ?? prev.locationCoords,
          telefonoOrganizador:
            data.telefonoOrganizador ?? prev.telefonoOrganizador,
          imagen: data.imagen ?? "",
          profesorId: data.profesorId ?? "",
          stravaMap: {
            id: data?.stravaMap?.id ?? "",
            summary_polyline: data?.stravaMap?.summary_polyline ?? "",
            polyline: data?.stravaMap?.polyline ?? "",
            resource_state: data?.stravaMap?.resource_state ?? 0,
          },
        }));
        setMarkerPos(data.locationCoords ?? { lat: -26.8333, lng: -65.2167 });
        setPreviewUrl(data.imagen ?? null);
      })(),
      {
        loading: "Cargando datos de la salida...",
        success: "Datos cargados con éxito",
        error: "Error al cargar los datos",
      }
    );
  }, [params.id]);

  // --------- FETCH ACTIVITIES + PROFES ----------
  useEffect(() => {
    (async () => {
      try {
        if (session?.user?.id) {
          const res = await fetch(
            `/api/strava/activities?userId=${session.user.id}`
          );
          const data = await res.json();
          if (!data?.error) setActivities(data);
        }
      } catch (e) {
        console.error("Error cargando actividades:", e);
      }
    })();

    (async () => {
      try {
        const res = await fetch(`/api/profile/profes`);
        const data = await res.json();
        setProfes(data);
        // Si ya hay profesor asignado, completar input visual
        const actual = data.find((p: any) => p._id === formData.profesorId);
        if (actual) setQueryProfesor(`${actual.firstname} ${actual.lastname}`);
      } catch (e) {
        console.error("Error cargando profes:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // --------- HANDLERS ----------
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "cupo" ? Number(value) : value,
    }));

    // sugerencias de ubicación
    if (name === "ubicacion") {
      debouncedFetchSuggestions(value);
    }
  };

  const handleProfesorSearch = (val: string) => {
    setQueryProfesor(val);
    const filtered = profes.filter((p) =>
      `${p.firstname} ${p.lastname}`.toLowerCase().includes(val.toLowerCase())
    );
    setProfesorSuggestions(filtered);
  };

  const handleProfesorPick = (p: any) => {
    setFormData((prev) => ({ ...prev, profesorId: p._id }));
    setQueryProfesor(`${p.firstname} ${p.lastname}`);
    setProfesorSuggestions([]);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setImagen(file);
    setPreviewUrl(URL.createObjectURL(file)); // preview instantáneo
  };

  const handleCoordsChange = async (coords: LatLng) => {
    setMarkerPos(coords);
    const direccion = await fetchAddressFromCoords(coords.lat, coords.lng);
    setFormData((prev) => ({
      ...prev,
      ubicacion: direccion || prev.ubicacion,
      coords: coords,
      locationCoords: coords,
      lat: coords.lat as any, // si tu modelo usa lat/lng sueltos
      lng: coords.lng as any,
    }));
  };

  const handleSuggestionClick = (s: any) => {
    const coords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setFormData((prev) => ({
      ...prev,
      ubicacion: s.display_name,
      coords,
      locationCoords: coords,
      lat: coords.lat as any,
      lng: coords.lng as any,
    }));
    setMarkerPos(coords);
    setSuggestions([]);
  };

  // --------- MAPBOX SEARCH ----------
  const fetchSuggestions = async (q: string) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error buscando sugerencias:", err);
    }
  };
  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 400),
    []
  );

  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/search/reverse?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      return data.display_name as string;
    } catch (error) {
      console.error("Error al obtener dirección inversa:", error);
      return "";
    }
  };

  // --------- SUBMIT ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // si hay nueva imagen, subimos a Firebase; si no, usamos la existente
      let imageUrl = formData.imagen || "";
      if (imagen) {
        const imageRef = ref(storage, `salidas/${uuidv4()}`);
        await uploadBytes(imageRef, imagen);
        imageUrl = await getDownloadURL(imageRef);
      }

      const payload = {
        ...formData,
        imagen: imageUrl,
        locationCoords: markerPos,
        // asegurar fecha/hora correctas
        fecha: formData.fecha, // yyyy-mm-dd
        hora: formData.hora, // HH:MM
      };

      const res = await fetch(`/api/social/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("PATCH failed");

      toast.success("Salida actualizada");
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la salida");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = confirm("¿Eliminar grupo? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await fetch(`/api/social/${params.id}`, { method: "DELETE" });
      toast.success("Salida eliminada con éxito");
      router.push("/dashboard");
    } catch {
      toast.error("No se pudo eliminar el grupo");
    }
  };

  // --------- UI ----------
  return (
    <div className="flex flex-col justify-center items-center bg-[#FEFBF9] mb-[150px]">
      <Toaster position="top-center" />
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] self-start bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center ml-5 mt-5"
      >
        <img
          src="/assets/icons/Collapse Arrow.svg"
          alt="back"
          className="h-[20px] w-[20px]"
        />
      </button>

      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl p-6">
        <h1 className="text-center font-normal text-2xl mb-4">Editar salida</h1>

        {/* Nombre */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">Nombre</span>
          <input
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        {/* Localidad */}
        <select
          name="localidad"
          value={formData.localidad}
          onChange={handleChange}
          className="w-full px-4 py-4 mb-3 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Localidad</option>
          <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
          <option value="Yerba Buena">Yerba Buena</option>
          <option value="Tafi Viejo">Tafi Viejo</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Deporte */}
        <select
          name="deporte"
          value={formData.deporte}
          onChange={handleChange}
          className="w-full px-4 py-4 mb-3 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Selecciona un deporte</option>
          <option value="Running">Running</option>
          <option value="Ciclismo">Ciclismo</option>
          <option value="Trekking">Trekking</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Duración */}
        <select
          name="duracion"
          value={formData.duracion}
          onChange={handleChange}
          className="w-full px-4 py-4 mb-3 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Duración</option>
          <option value="1 hs">1 hs</option>
          <option value="2 hs">2 hs</option>
          <option value="3 hs">3 hs</option>
        </select>

        {/* Dificultad */}
        <select
          name="dificultad"
          value={formData.dificultad}
          onChange={handleChange}
          className="w-full px-4 py-4 mb-3 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Dificultad</option>
          <option value="facil">Principiantes</option>
          <option value="media">Media</option>
          <option value="dificil">Difícil</option>
        </select>

        {/* Precio */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">Precio</span>
          <input
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            placeholder="$9.999"
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        {/* Alias / CBU */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">CBU/Alias</span>
          <input
            name="alias"
            value={formData.alias}
            onChange={handleChange}
            placeholder="Alias"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        {/* Cupo */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">Cupo</span>
          <input
            name="cupo"
            type="number"
            value={formData.cupo}
            onChange={handleChange}
            placeholder="Cantidad máxima de personas"
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        {/* Fecha y Hora */}
        <div className="flex gap-3 mb-3">
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
          />
          <input
            type="time"
            name="hora"
            value={formData.hora}
            onChange={handleChange}
            className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
          />
        </div>

        {/* Descripción (Markdown) */}
        <div className="space-y-2 mb-4">
          <label className="block">
            Descripción{" "}
            <span className="text-xs text-slate-500">(Markdown)</span>
          </label>
          <DescriptionEditor
            value={formData.descripcion ?? ""} // ← ahora controlado
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, descripcion: val }))
            }
            maxChars={2000}
          />
        </div>

        {/* {formData.descripcion?.trim() && (
        <div className="w-full max-w-md px-6">
          <div className="mt-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-neutral-800">Previsualización</div>
            <DescriptionMarkdown text={formData.descripcion} />
          </div>
        </div>
      )} */}

        {/* Detalles */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">¿Qué incluye la salida?</span>
          <textarea
            name="detalles"
            value={formData.detalles}
            onChange={handleChange}
            placeholder="Seguro, guía, etc..."
            className="w-full px-3 py-4 border rounded-[15px] shadow-md"
          />
        </label>

        {/* Teléfono y WhatsApp */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">
            Número de teléfono del organizador
          </span>
          <input
            name="telefonoOrganizador"
            value={formData.telefonoOrganizador}
            onChange={handleChange}
            placeholder="+5491123456789"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        <label className="block mb-3">
          <span className="block text-sm mb-1">Link del grupo de WhatsApp</span>
          <input
            name="whatsappLink"
            value={formData.whatsappLink}
            onChange={handleChange}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        {/* Profesor */}
        <label className="block relative mb-3">
          <span className="block text-sm mb-1">Asignar profesor</span>
          <input
            type="text"
            value={queryProfesor}
            onChange={(e) => handleProfesorSearch(e.target.value)}
            placeholder="Buscar profesor..."
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
          {profesorSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border shadow-md rounded-md max-h-40 overflow-y-auto z-50">
              {profesorSuggestions.map((p) => (
                <li
                  key={p._id}
                  className="px-4 py-2 cursor-pointer hover:bg-orange-100"
                  onClick={() => handleProfesorPick(p)}
                >
                  {p.firstname} {p.lastname}
                </li>
              ))}
            </ul>
          )}
        </label>

        {/* Imagen */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">Imagen</span>
          <div className="w-full h-40 bg-white border shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                className="w-full h-full object-cover absolute top-0 left-0"
              />
            ) : (
              <span className="text-gray-500 z-0">Cambiar imagen</span>
            )}
          </div>
        </label>

        {/* Strava activities */}
        <label className="block mb-3">
          <span className="block text-sm mb-1">Actividades Strava</span>
          <select
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            value={
              // si ya hay una activity previa con map.id, tratamos de matchear
              activities.find((a) => a.map?.id === formData.stravaMap.id)?.id ??
              ""
            }
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedActivity = activities.find(
                (a) => a.id.toString() === selectedId
              );
              if (selectedActivity) {
                setFormData((prev) => ({
                  ...prev,
                  stravaMap: {
                    id: selectedActivity.map.id,
                    summary_polyline: selectedActivity.map.summary_polyline,
                    polyline: selectedActivity.map.polyline,
                    resource_state: selectedActivity.map.resource_state,
                  },
                }));
              } else {
                // reset si eligen "ninguna"
                setFormData((prev) => ({
                  ...prev,
                  stravaMap: {
                    id: "",
                    summary_polyline: "",
                    polyline: "",
                    resource_state: 0,
                  },
                }));
              }
            }}
          >
            <option value="">Ninguna</option>
            {activities?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} - {Math.round(a.distance / 1000)} km
              </option>
            ))}
          </select>
        </label>

        {/* Ubicación + Mapbox */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Buscar ubicación..."
              className="w-full p-2 border border-gray-300 rounded"
            />
            {suggestions.length > 0 && (
              <ul className="absolute bg-white shadow-md w-full rounded mt-1 max-h-48 overflow-auto z-10">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-full h-[400px] border border-gray-300 rounded">
            <MapWithNoSSR position={markerPos} onChange={handleCoordsChange} />
          </div>
        </div>

        {/* Submit / Delete */}
        <button
          className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-2 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Guardando cambios" : "Guardar cambios"}
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="w-full mt-2 text-red-500 py-3"
        >
          Eliminar salida
        </button>
      </form>

      {/* Vista previa (opcional) */}

      <div className="pb-[300px]" />
    </div>
  );
}
