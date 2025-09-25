"use client";

import { useState, useEffect } from "react";
import TopContainer from "@/components/TopContainer";
import EventModal from "@/components/EventModal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import { Toaster } from "react-hot-toast";

const categories = [
  { label: "Running", icon: "/assets/icons/directions_run_40dp_FFB86A.svg" },
  { label: "Ciclismo", icon: "/assets/icons/directions_bike_40dp_FFB86A.svg" },
  { label: "Trekking", icon: "/assets/icons/hiking_40dp_FFB86A.svg" },
  { label: "Otros", icon: "/assets/icons/terrain_40dp_FFB86A.svg" },
];

type EventType = {
  _id: string;
  title: string;
  date: string;
  time: string;
  price: string;
  image: string;
  location: string;
  creadorId: string;
  localidad: string;
  category: string;
  locationCoords: {
    lat: number;
    lng: number;
  };
  teacher: string;
    dificultad?: string;
  stravaMap?:{
        id:  string,
        summary_polyline: string,
        polyline: string,
        resource_state: number,
  }
  cupo: number;
};

type ModalEvent = {
  id: any;
  title: string;
  date: string;
  time: string;
  location: string;
  localidad: string;
  teacher: string;
  creadorId: string;
  participants: string[];
  locationCoords: {
    lat: number;
    lng: number;
  };
};

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
  imagen: string;
  imagenUrl: string;
};

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("Running");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ModalEvent | null>(null);
  const [yaUnido, setYaUnido] = useState(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [teamSocialEvents, setTeamSocialEvents] = useState<EventType[]>([]);
  const [selectedLocalidad, setSelectedLocalidad] = useState(
    "San Miguel de Tucuman"
  );
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstname: session?.user.firstname || "",
    lastname: session?.user.lastname || "",
    email: session?.user.email || "",
    rol: session?.user.rol || "",
  });

  useEffect(() => {
    const fetchSalidas = async () => {
      try {
        const res = await fetch("/api/social");
        const rawData = await res.json();
        console.log(rawData);

        const mappedData = rawData.map((item: any) => ({
          _id: item._id,
          title: item.nombre,
          date: item.fecha,
          time: item.hora,
          price: item.precio,
          image: item.imagen,
          category: item.deporte,
          creadorId: item.creador_id._id,
          localidad: item.localidad,
          location: item.ubicacion,
          locationCoords: item.locationCoords,
          highlighted: false,
          dificultad: item.dificultad,
          teacher: item.creador_id?.firstname || "Sin profe",
          cupo: item.cupo,
          stravaMap: item.stravaMap,
        }));

        setEvents(mappedData);
      } catch (error) {
        console.error("Error al obtener salidas:", error);
      }
    };

    fetchSalidas();
  }, []);

  useEffect(() => {
    const fetchTeamSocial = async () => {
      try {
        const res = await fetch("/api/team-social");
        const rawData = await res.json();
        console.log("Raw team-social data:", rawData);

        const mappedData = rawData.map((item: any) => ({
          _id: item._id,
          title: item.nombre,
          date: item.fecha,
          time: item.hora,
          price: item.precio,
          image: item.imagen,
          localidad: item.localidad,
          category: item.deporte,
          location: item.ubicacion,
          locationCoords: item.locationCoords,
        }));

        setTeamSocialEvents(mappedData);
      } catch (error) {
        console.error("Error al obtener eventos de Team Social:", error);
      }
    };

    fetchTeamSocial();
  }, []);

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const res = await fetch("/api/academias");
        const data = await res.json();

        // 🔥 Nuevo paso: obtener las URLs desde Firebase
        const academiasConImagenes = await Promise.all(
          data.map(async (academia) => {
            try {
              // Intentamos traer la URL de Firebase
              const url = await getAcademyImage(
                "profile-image.jpg",
                academia._id
              );
              return { ...academia, imagenUrl: url };
            } catch (error) {
              console.error("Error al obtener imagen de Firebase:", error);
              // En caso de error, ponemos una imagen por defecto
              return {
                ...academia,
                imagenUrl:
                  "https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg",
              };
            }
          })
        );

        setAcademias(academiasConImagenes);
      } catch (error) {
        console.error("Error al obtener academias:", error);
      }
    };

    fetchAcademias();
  }, []);

  const filteredEvents = events.filter(
    (event) =>
      event.category === selectedCategory &&
      event.localidad === selectedLocalidad
  );

  const filteredTeamSocial = teamSocialEvents.filter(
    (event) => event.category === selectedCategory
  );

  const social = filteredEvents;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(academias);

  const futureEvents = events.filter((event) => {
    if (!event.date) return false;

    const [year, month, day] = event.date.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);
    return eventDate >= today;
  });

  const futureTeamSocialEvents = filteredTeamSocial.filter((event) => {
    if (!event.date) return false;

    const [year, month, day] = event.date.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);
    return eventDate >= today;
  });

 







  return (
    <>
      <Toaster position="top-center" />
      <main className="bg-background min-h-screen text-foreground px-4 py-6 space-y-6 w-[390px] mx-auto">
        <TopContainer
          selectedLocalidad={selectedLocalidad}
          setSelectedLocalidad={setSelectedLocalidad}
        />

      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-medium">Proximas salidas</h1>


        {futureEvents.length > 0 ? (futureEvents.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onJoin={(e) => console.log("Unido a:", e.title)}
            onMap={(coords) =>
              console.log("Abrir mapa en:", coords.lat, coords.lng)
            }
          />
        ))) : (<EmptyState title ="Sin salidas disponibles"
  description= "Una vez que carguemos salidas, las vas a ver acá." imageSrc="/assets/icons/emptyTrekking.png"></EmptyState>) }



      </section>
      <div className="pb-[200px]"></div>

        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
        />
      </main>
    </>
  );
}
