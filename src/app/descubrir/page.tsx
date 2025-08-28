'use client';
import React, { use } from "react";
import { useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";
import { on } from "events";

export default function Page() {

  const route = useRouter();
 
  return (
    <div>
      <EmptyState
        title="Página en construcción"
        description="Los devs estamos trabajando para traerte nuevas funcionalidades. ¡Vuelve pronto!"
        subdecription=""
        imageSrc="/assets/icons/astronaut-dog-svgrepo-com.svg"
        primaryAction={{onClick: () => route.push("/home"), label: "Volver al Home"}}
      />
    </div>
  );
}