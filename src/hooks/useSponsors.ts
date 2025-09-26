import { useQuery } from "@tanstack/react-query";

export interface Sponsor {
  _id: string;
  name: string;
  imagen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorsResponse {
  success: boolean;
  data: Sponsor[];
  count: number;
}

const fetchSponsors = async (): Promise<SponsorsResponse> => {
  const response = await fetch("/api/sponsors");

  if (!response.ok) {
    throw new Error("Error al cargar sponsors");
  }

  return response.json();
};

export const useSponsors = () => {
  return useQuery({
    queryKey: ["sponsors"],
    queryFn: fetchSponsors,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};
