'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    mapEmbedUrl: string;
    teacher: string;
    participants: string[];
  };
}

export default function EventModal({ isOpen, onClose, event }: EventModalProps) {
  const router = useRouter();
  const eventId = 1;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50  flex items-end justify-center pb-[80px]">
      <div className="bg-[#aeadad] w-full max-w-md rounded-t-2xl p-4 space-y-4 relative">
        <button className="absolute rounded-[12px] bg-white top-2 right-4 text-[12px] px-1" onClick={onClose}>✕</button>

        <iframe
          src={event.mapEmbedUrl}
          className="w-full h-40 rounded-xl border"
          allowFullScreen
          loading="lazy"
        ></iframe>

        <div className="text-sm">
          <p className="font-semibold text-white">📍 {event.location}</p>
          <p className="font-medium text-white">📅 {event.date} - ⏰ {event.time}</p>
        </div>

        <div className="text-sm text-white">
          <p className="font-medium text-white">👨‍🏫 {event.teacher}</p>
          <p>👥 Participantes: {event.participants.join(', ')}</p>
        </div>

        <button
          className="w-full py-2 border border-red-600 rounded-full text-red-600 font-semibold"
          onClick={onClose}
        >
          Salir
        </button>

        <button onClick={() => router.push(`/social/`)}
        className="block mx-auto text-sm text-gray-600">Más info</button>
      </div>
    </div>
  );
}
