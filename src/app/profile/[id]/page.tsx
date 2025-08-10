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




// export default async function ProfilePage({ params }: PageProps) {
//   const { id } = params;
//   return <UserPublicProfile userId={id} />;
// }


// export default async function UserProfile({ user }: UserProfileProps) {
//   const router = useRouter();
    
//   return (
  
//   <div className="w-[390px]">
//     <div className="">
//          <button
//         onClick={() => router.back()}
//         className="text-[#C76C01] self-star shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center ml-5 mt-5 mb-2"
//       >
//         <img
//           src="/assets/icons/Collapse Arrow.svg"
//           alt="callback"
//           className="h-[20px] w-[20px]"
//         />
//       </button>
//     </div>
     
//       <UserPublicProfile/>
//   </div>
//   )
// }

