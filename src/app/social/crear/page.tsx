"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/libs/firebaseConfig";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

{/*// Configurar íconos para que se muestren correctamente
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});*/}

const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

interface LatLng {
  lat: number;
  lng: number;
}

export default function CrearSalidaPage() {
  const router = useRouter();
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


 const [formData, setFormData] = useState({
  nombre: "",
  ubicacion: "",
  precio: "",
  deporte: "",
  fecha: "",
  hora: "",
  duracion: "",
  descripcion: "",
  whatsappLink: "",
  telefonoOrganizador: "",
  coords: null as LatLng | null,
});

  const [imagen, setImagen] = useState<File | null>(null);

  {/*}
  function LocationPicker({ onChange, position }: { onChange: (latlng: LatLng) => void, position: LatLng | null }) {
    function LocationMarker() {
      useMapEvents({
        click(e) {
          onChange(e.latlng);
        }
      });
      return position ? <Marker position={position} /> : null;
    }

    return (
      <MapContainer center={[-26.8333, -65.2167] as [number, number]} zoom={13} className="h-[200px] w-full rounded-md">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
      </MapContainer>
    );
  }
*/}
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };


  const handleCoordsChange = (coords: LatLng) => {
    setFormData(prev => ({ ...prev, coords }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = "";

    if (imagen) {
      const imageRef = ref(storage, `salidas/${uuidv4()}`);
      await uploadBytes(imageRef, imagen);
      imageUrl = await getDownloadURL(imageRef);
    }

    const salidaData = {
      ...formData,
      imagen: imageUrl,
      locationCoords: formData.coords
    };

    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(salidaData),
    });

    if (res.ok) router.push("/home");
    else console.error("Error al crear salida social");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 space-y-3 bg-white rounded-xl shadow-md mb-[80px] bg-[#FEFBF9]">
     
     <div className="w-full h-40 bg-gray-200 rounded-md flex items-center justify-center relative overflow-hidden">

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
        <span className="text-gray-500 z-0">Subir imagen</span>
      )}
    </div>


      <h2 className="text-center font-bold text-lg bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent">Crear <span className="text-black">salida</span></h2>
      <label className="block">
        Nombre
         <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="salida en grupo" className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" />
      </label>

      <label className="block">
            Ubicación
          <input name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="parque central" className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" />
    </label>
      <select name="deporte" value={formData.deporte} onChange={handleChange} className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400" >
        <option value="">Selecciona un deporte</option>
        <option value="Running">Running</option>
        <option value="Ciclismo">Ciclismo</option>
        <option value="Trekking">Trekking</option>
        <option value="Otros">Otros</option>
      </select>
      
      <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400" />

      <div className="flex gap-2">
        <input type="time" name="hora" value={formData.hora} onChange={handleChange} className="flex-1 px-3 py-4 border rounded-[15px] text-slave-400 sha" />
        <select name="duracion" value={formData.duracion} onChange={handleChange} className="flex-1 px-3 py-4 border shadow-md rounded-[15px] text-slate-400">
          <option value="">Duración</option>
          <option value="1 hs">1 hs</option>
          <option value="2 hs">2 hs</option>
          <option value="3 hs">3 hs</option>
        </select>
      </div>

      <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Organizamos una salida de running" className="w-full px-3 py-4 border rounded-[15px]" />
            <label className="block">
        Link del grupo de WhatsApp
        <input
          name="whatsappLink"
          value={formData.whatsappLink || ""}
          onChange={handleChange}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>

      <label className="block">
        Número de teléfono del organizador
        <input
          name="telefonoOrganizador"
          value={formData.telefonoOrganizador || ""}
          onChange={handleChange}
          placeholder="+5491123456789"
          className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </label>

      
       <MapWithNoSSR position={markerPos} onChange={handleCoordsChange} />
        <p className="text-red-500 text-sm">*Señalar en el mapa la ubicacion para que se guarde la salida</p>
      <button type="submit" className="w-full py-2 rounded-md text-white  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] font-bold">Crear salida</button>

        <div className="w-full flex justify-center">
          <button type="button" onClick={() => router.back()} className="text-orange-500 font-semibold cente ">Atrás</button>

        </div>

      
      <div className="mb-[190px]"></div>
    </form>
  );
}