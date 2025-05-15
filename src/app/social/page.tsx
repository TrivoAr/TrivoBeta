// app/event/[id]/page.tsx
import Image from 'next/image';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EventPage({ params }: PageProps) {
  const eventId = params.id;

  // Simulamos la data del evento (esto después lo podés hacer fetch desde una API o base de datos)
  const event = {
    title: 'Running en el parque',
    location: 'Parque 9 de julio',
    date: 'Lunes 28/04/25',
    time: '16:00 hs',
    difficulty: 'Baja',
    organizer: 'Profe Frank',
    description:
      'Organizamos una salida de running tranquila por semana para quien quiera sumarse y adentrarse en este hermoso deporte. ¡Anímate y sumate esta semana a tiempo!',
    participants: [
      '/assets/avatars/user1.png',
      '/assets/avatars/user2.png',
      '/assets/avatars/user3.png',
    ],
    image: '/assets/icons/pexels-runffwpu-2402761.png',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.3356758610597!2d-65.2079804!3d-26.8325606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94225d3e733c3455%3A0xa6bbbe801421c45b!2sParque%209%20de%20Julio!5e0!3m2!1ses!2sar!4v1680000000000!5m2!1ses!2sar',
  };

  return (
    <main className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      {/* Título */}
      <button className="text-sm mb-2">{'< Volver'}</button>

      <h1 className="text-xl font-bold">
        <span className="text-[#C76C01]">Running</span> en el parque
      </h1>

      {/* Imagen principal */}
      <div className="w-full h-[180px] rounded-xl overflow-hidden border-2 border-blue-200">
        <Image
          src={event.image}
          alt="Evento"
          width={500}
          height={180}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 text-sm text-gray-700">
        <p>📍 {event.location}</p>
        <p>🕒 {event.time}</p>
      </div>
      <p className="text-sm text-gray-700">📅 {event.date}</p>
      <p className="text-sm text-gray-700">🔥 Dificultad: {event.difficulty}</p>

      {/* Participantes y organizador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="font-semibold">Participantes:</p>
          <div className="flex -space-x-2">
            {event.participants.map((p, i) => (
              <Image
                key={i}
                src={p}
                alt={`Avatar ${i}`}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-700">
          <p className="font-semibold">Organiza</p>
          <p>{event.organizer}</p>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <h2 className="text-lg font-bold text-[#C76C01] mb-1">Descripción</h2>
        <p className="text-sm text-gray-700">{event.description}</p>
      </div>

      {/* Ubicación */}
      <div>
        <h2 className="text-lg font-bold text-[#C76C01] mb-1">Ubicación</h2>
        <div className="rounded-xl overflow-hidden border shadow-sm">
          <iframe
            src={event.mapEmbedUrl}
            width="100%"
            height="200"
            loading="lazy"
            allowFullScreen
            className="w-full"
          ></iframe>
        </div>
      </div>
    </main>
  );
}
