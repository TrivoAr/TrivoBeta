'use client';

import { useState, useEffect } from 'react';
import TopContainer from "@/components/TopContainer";
import EventModal from "@/components/EventModal";
import { useRouter } from 'next/navigation';

const categories = [
  { label: 'Running', icon: '/assets/icons/Group 33838.png' },
  { label: 'Ciclismo', icon: '/assets/icons/Cycling.png' },
  { label: 'Trekking', icon: '/assets/icons/Trekking.png' },
  { label: 'Otros', icon: '/assets/icons/Mountain.png' },
];

type EventType = {
  _id: string;
  title: string;
  date: string;
  time: string;
  price: string;
  image: string;
  location: string;
  category: string;
  locationCoords: {
      lat: number;
      lng: number;
    };
};

type ModalEvent = {
  id: any;
  title: string;
  date: string;
  time: string;
  location: string;
  teacher: string;
  participants: string[];
  locationCoords: {
    lat: number;
    lng: number;
  };
};


const socialTeam = [
  {
    id: 1,
    title: 'Parque 9 de julio',
    date: 'Lunes 28/04/25',
    time: '16:00 hs',
    price: '$25.000',
    image: '/assets/icons/pexels-runffwpu-2402761.png',
    category: 'Running',
    highlighted: true,
  },
  {
    id: 2,
    title: 'Sendero Norte',
    date: 'Martes 29/04/25',
    time: '17:00 hs',
    price: '$30.000',
    image: '/assets/icons/pexels-runffwpu-2402761.png',
    category: 'Running',
    highlighted: true,
  },
  {
    id: 3,
    title: 'Cerro San Javier',
    date: 'Miércoles 30/04/25',
    time: '18:00 hs',
    price: '$28.000',
    image: '/assets/icons/pexels-runffwpu-2402761.png',
    category: 'Running',
    highlighted: true,
  },
];

const discounts = [
  {
    id: 1,
    title: '20% OFF',
    subtitle: 'en toda la carta',
    image: '/assets/icons/bonaportada.png',
    logo: '/assets/icons/bona.png',
  },
  {
    id: 2,
    title: '25% OFF',
    subtitle: 'en la cuota mensual',
    image: '/assets/icons/rc.png',
    logo: '/assets/icons/Logo-RC-Gym 1.png',
  },
  {
    id: 3,
    title: '40% OFF',
    subtitle: 'en todas las salas',
    image: '/assets/icons/gold-rush.png',
    logo: '/assets/icons/escaperoom.png',
  },
];

export default function Home() {
  const router = useRouter();
 const [selectedCategory, setSelectedCategory] = useState('Running');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ModalEvent | null>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [teamSocialEvents, setTeamSocialEvents] = useState<EventType[]>([]);

useEffect(() => {
  const fetchSalidas = async () => {
    try {
      const res = await fetch('/api/social');
      const rawData = await res.json();

      const mappedData = rawData.map((item: any) => ({
        _id: item._id,
        title: item.nombre,
        date: item.fecha,
        time: item.hora,
        price: item.duracion, // o podés poner un valor fijo como "Gratis"
        image: item.imagen,
        category: item.deporte,
        location: item.ubicacion,
        locationCoords: item.locationCoords,
        highlighted: false, // Podés cambiar esto si tenés un campo para destacar
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
      const res = await fetch('/api/team-social');
      const rawData = await res.json();

      const mappedData = rawData.map((item: any) => ({
        _id: item._id,
        title: item.nombre,
        date: item.fecha,
        time: item.hora,
        price: item.duracion,
        image: item.imagen,
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

 const filteredTeamSocial = teamSocialEvents.filter(
  (event) => event.category === selectedCategory
);

  const filteredEvents = events.filter((event) => event.category === selectedCategory);
  const social = filteredEvents;


  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <TopContainer />
      {/* Categorías */}
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            className={`flex-shrink-0 w-[74px] h-[74px] rounded-[20px]  border ${
              selectedCategory === cat.label
                ? "bg-orange-500 text-white"
                : "bg-white text-[#808488]"
            } flex flex-col items-center justify-center`}
          >
            <img
              src={cat.icon}
              alt={cat.label}
              className="w-[25px] h-[25px] object-contain mb-4"
            />
            <span className="text-[11px] font-semibold leading-none text-center">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Salidas destacadas */}
      <section>
        <h2 className="text-2xl font-bold mb-3">
          <span className="text-[#C76C01]">Salidas</span> destacadas
        </h2>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4">
            {social.map((event) => (
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
                        {event.location}
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
                    <span className="bg-[#000000B2] text-[#C76C01] text-[10px] font-semibold px-2 py-[2px] rounded-full">
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
                          locationCoords: event.locationCoords, // reemplazá si tenés el link real
                          teacher: "Profe Frank", // o podrías vincularlo con el `creador_id` si tenés su info
                          participants: ["👤", "👤", "👤"], // podés mapear esto después
                        });
                        setIsModalOpen(true);
                      }}
                      style={{
                        background:
                          "linear-gradient(90deg, #C76C01 0%, #FFBD6E 100%)",
                      }}
                      className="text-black text-[10px] font-semibold h-[22px] w-[79px] rounded-[20px]"
                    >
                      Unirse
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Team */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">
            <span className="text-[#C76C01]">Social</span> Team
          </h2>
          <button className="text-sm text-gray-400">ver todos</button>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4">
{filteredTeamSocial.map((event) => (
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
        <img src="/assets/icons/Calendar.svg" alt="" className="w-[14px] h-[14px]" />
        {event.date}
      </p>
      <p className="text-xs flex items-center gap-1 mb-[2px]">
        <img src="/assets/icons/Clock.svg" alt="" className="w-[14px] h-[14px]" />
        {event.time}
      </p>
      <p className="text-xs flex items-center gap-1">
        <img src="/assets/icons/Us Dollar Circled.svg" alt="" className="w-[14px] h-[14px]" />
        {event.price}
      </p>
      <div className="flex justify-end">
        <button
         onClick={() => router.push(`/team-social/${event._id}`)}
          className="self-end mt-2 text-black text-xs font-semibold rounded-full px-4 py-1"
          style={{
            background: "linear-gradient(90deg, #C76C01 0%, #FFBD6E 100%)",
          }}
        >
          Info
        </button>
      </div>
    </div>
  </div>
))}

          </div>
        </div>
      </section>

      {/* Kpons Section */}
      <section>
        <div className="flex justify-between items-center ">
          <img
            src="/assets/icons/Group 33832.png"
            alt="Kpons"
            className="h-[130px] object-contain"
          />
          <button className="text-sm text-gray-400">ver todos</button>
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
        </div>
      </section>
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </main>
  );
}
