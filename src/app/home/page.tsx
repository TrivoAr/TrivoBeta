"use client";

import { useState, useEffect } from "react";
import TopContainer from "@/components/TopContainer";
import EventModal from "@/components/EventModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { data } from "autoprefixer";
import TeamEventPage from "../team-social/[id]/page";
import TeamSocial from "@/models/teamSocial";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";

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

// const discounts = [
//   {
//     id: 1,
//     title: "20% OFF",
//     subtitle: "en toda la carta",
//     image: "/assets/icons/bonaportada.png",
//     logo: "/assets/icons/bona.png",
//   },
//   {
//     id: 2,
//     title: "25% OFF",
//     subtitle: "en la cuota mensual",
//     image: "/assets/icons/rc.png",
//     logo: "/assets/icons/Logo-RC-Gym 1.png",
//   },
//   {
//     id: 3,
//     title: "40% OFF",
//     subtitle: "en todas las salas",
//     image: "/assets/icons/gold-rush.png",
//     logo: "/assets/icons/escaperoom.png",
//   },
// ];

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
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
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
          price: item.precio, // o podés poner un valor fijo como "Gratis"
          image: item.imagen,
          category: item.deporte,
          creadorId: item.creador_id._id,
          localidad: item.localidad,
          location: item.ubicacion,
          locationCoords: item.locationCoords,
          highlighted: false,
          teacher: item.creador_id?.firstname || "Sin profe", // Podés cambiar esto si tenés un campo para destacar
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
        console.log("academias", data);

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

  const futureEvents = social.filter((event) => {
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
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer
        selectedLocalidad={selectedLocalidad}
        setSelectedLocalidad={setSelectedLocalidad}
      />
      {/* Categorías */}
      <div className="flex space-x-3 justify-center overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            className={`flex-shrink-0 w-[74px] h-[74px] rounded-[20px]  border shadow-md ${
              selectedCategory === cat.label
                ? "border-2 border-orange-200 text-orange-300"
                : "bg-white text-[#808488]"
            } flex flex-col items-center justify-center`}
          >
            <img
              src={cat.icon}
              alt={cat.label}
              className="w-[25px] h-[25px] object-contain mb-4 border-[#C76C01]"
            />
            <span className="text-[11px] font-semibold leading-none text-center">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Salidas destacadas */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold mb-3">
            <span className="text-[#C76C01]">Salidas</span> destacadas
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          {futureEvents.length > 0 ? (
            <div className="flex space-x-4">
              {futureEvents.map((event) => (
                <div
                  key={event._id}
                  className="flex-shrink-0 w-[310px] h-[176px] rounded-[15px] overflow-hidden shadow-md relative"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#00000080] p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="text-white space-y-1">
                        <p className="text-xs flex items-center gap-1">
                          <img
                            src="/assets/icons/Location.svg"
                            alt=""
                            className="w-[14px] h-[14px] object-cover"
                          />{" "}
                          {event.localidad}
                        </p>
                        <p className="text-xs flex items-center gap-1">
                          <img
                            src="/assets/icons/Calendar.svg"
                            alt=""
                            className="w-[14px] h-[14px] object-cover"
                          />{" "}
                          {event.date}
                        </p>
                        <p className="text-xs flex items-center gap-1">
                          <img
                            src="/assets/icons/Clock.svg"
                            alt=""
                            className="w-[14px] h-[14px] object-cover"
                          />{" "}
                          {event.time}
                        </p>
                      </div>
                      <span className="bg-[#000000B2] text-white  text-[10px] font-bold px-2 py-[2px] rounded-full">
                        {event.category}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedEvent({
                            id: event._id,
                            title: event.title,
                            date: event.date,
                            time: event.time,
                            location: event.location,
                            locationCoords: event.locationCoords,
                            localidad: event.localidad,
                            creadorId: event.creadorId, // reemplazá si tenés el link real
                            teacher: event.teacher, // o podrías vincularlo con el `creador_id` si tenés su info
                            participants: ["👤", "👤", "👤"], // podés mapear esto después
                          });
                          setIsModalOpen(true);
                        }}
                        style={{
                          background:
                            "linear-gradient(90deg, #C76C01 0%, #FFBD6E 100%)",
                        }}
                        className="text-black text-[10px] font-semibold h-[22px] w-[79px] rounded-[20px]  z-20"
                      >
                        Unirse
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-bold">No hay salidas cargadas</p>
          )}
        </div>
      </section>

      {/* Social Team */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">
            <span className="text-[#C76C01]">Social</span> Team
          </h2>
          {/* {formData.rol=== "dueño de academia" && (
          <button
            className="text-sm text-gray-400"
            onClick={() => router.push(`/team-social/crear`)}
          >
            <img
              className="h-[26px] w-[26px] color-black"
              src="/assets/Logo/add-circle-svgrepo-com.svg"
              alt=""
            />
          </button>)} */}
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          {futureTeamSocialEvents.length > 0 ? (
            <div className="flex space-x-4">
              {futureTeamSocialEvents.map((event) => (
                <div
                  key={event._id}
                  className="flex-shrink-0 w-[240px] h-[180px] rounded-2xl p-4 text-white flex flex-col justify-between relative bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${event.image})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 rounded-2xl z-0" />
                  <div className="absolute top-2 right-2 bg-[#000000B2] text-[#C76C01] text-[10px] font-semibold px-2 py-[2px] rounded-full z-10">
                    {event.category}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10 text-white">
                    <p className="text-sm font-semibold mb-1">{event.title}</p>
                    <p className="text-xs flex items-center gap-1 mb-[2px]">
                      <img
                        src="/assets/icons/Calendar.svg"
                        alt=""
                        className="w-[14px] h-[14px]"
                      />
                      {event.date}
                    </p>
                    <p className="text-xs flex items-center gap-1 mb-[2px]">
                      <img
                        src="/assets/icons/Clock.svg"
                        alt=""
                        className="w-[14px] h-[14px]"
                      />
                      {event.time}
                    </p>
                    <p className="text-xs flex items-center gap-1">
                      <img
                        src="/assets/icons/Us Dollar Circled.svg"
                        alt=""
                        className="w-[14px] h-[14px]"
                      />
                      ${Number(event.price).toLocaleString("es-AR")}
                    </p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => router.push(`/team-social/${event._id}`)}
                        className="self-end mt-2 text-black text-xs font-semibold rounded-full px-4 py-1"
                        style={{
                          background:
                            "linear-gradient(90deg, #C76C01 0%, #FFBD6E 100%)",
                        }}
                      >
                        Info
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-bold">No hay social teams cargados</p>
          )}
        </div>
      </section>

      {/* Academias destacadas */}

      <section>
        <div className="">
          <h2 className="text-2xl font-bold mb-3">
            <span className="text-[#C76C01]">Grupos de entrenamiento</span>
          </h2>
          {/* {formData.rol=== "dueño de academia" && (
          <button
            className="text-sm text-gray-400"
            onClick={() => router.push("/academias/crear")}
          >
            <img
              className="h-[26px] w-[26px]"
              src="/assets/Logo/add-circle-svgrepo-com.svg"
              alt=""
            />
          </button>)} */}
        </div>
        <div
          className={`overflow-x-auto scrollbar-hide ${
            academias.length > 0 ? "h-[245px]" : "h-auto"
          }`}
        >
          <div className="flex space-x-4">
            {academias.length > 0 ? (
              academias.map((academia) => (
                <div
                  key={academia._id}
                  className="flex-shrink-0 w-[240px] h-[170px] rounded-[20px] overflow-hidden shadow-md relative border"
                  style={{
                    backgroundImage: `linear-gradient(
      0deg,
      rgba(0,0,0,0.2),
      rgba(0,0,0,0.2)),url(${academia.imagenUrl})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                  onClick={() => router.push(`/academias/${academia._id}`)}
                ></div>
              ))
            ) : (
              <p>No hay grupos de entrenamientos</p>
            )}
          </div>
        </div>
      </section>

      {/* Kpons Section */}
      <section className="pb-[150px]">
        {/* <div className="flex justify-between items-center ">
          <img
            src="/assets/icons/Group 33832.png"
            alt="Kpons"
            className="h-[130px] object-contain"
          />
          <button className="text-sm text-gray-400">Próximamente</button>
        </div>
        <div className="space-y-3 mt-[-20px] pb-[80px]">
          {discounts.map((promo) => (
            <div
              key={promo.id}
              className="w-full h-[80px] rounded-xl overflow-hidden relative flex items-center px-4 text-white"
              style={{
                backgroundImage: `url(${promo.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="z-10">
                <p className="text-xl font-bold">{promo.title}</p>
                <p className="text-sm">{promo.subtitle}</p>
              </div>
              <img
                src={promo.logo}
                alt="Logo"
                className="ml-auto w-12 h-12 object-contain z-10"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
            </div>
          ))}
        </div> */}
      </section>
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </main>
  );
}
