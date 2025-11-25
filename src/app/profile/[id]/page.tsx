"use client";

import UserPublicProfile from "@/components/UserPublicProfile";
import { use } from "react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ProfilePage({ params }: PageProps) {
  const { id } = use(params);
  return <UserPublicProfile userId={id} />;
}
