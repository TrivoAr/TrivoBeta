'use client';
// components/UserProfile.tsx
import UserPublicProfile from "@/components/UserPublicProfile";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  user: {
    name: string;
    location: string;
    bio: string;
    profilePicture: string;
    joinDate: string;
  };
}
 type PageProps = { params: { id: string } };
 export default async function ProfilePage({ params }: PageProps) {
  const { id } = params;
  return <UserPublicProfile userId={id} />;
}







 


    

