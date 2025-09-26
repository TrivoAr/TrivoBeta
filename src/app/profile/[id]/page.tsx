"use client";

import UserPublicProfile from "@/components/UserPublicProfile";

type PageProps = {
  params: { id: string };
};

export default function ProfilePage({ params }: PageProps) {
  const { id } = params;
  return <UserPublicProfile userId={id} />;
}
