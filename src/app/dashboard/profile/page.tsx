"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import PushManager from "@/components/PushManager";
import ThemeToggle from "@/components/ThemeToggle";

function ProfilePage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    firstname: session?.user.firstname || "",
    lastname: session?.user.lastname || "",
    email: session?.user.email || "",
    rol: session?.user.rol || "",
    instagram: session?.user.instagram || "",
    facebook: session?.user.facebook || "",
    twitter: session?.user.twitter || "",
    imagen: session?.user.imagen || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);

  const router = useRouter();

  // Actualizar formData cuando la sesión cambie
  useEffect(() => {
    if (session?.user) {
      setFormData({
        firstname: session.user.firstname || "",
        lastname: session.user.lastname,
        email: session.user.email || "",
        rol: session.user.rol || "",
        instagram: session.user.instagram || "",
        facebook: session.user.facebook || "",
        twitter: session.user.twitter || "",
        imagen: session.user.imagen || "",
      });
    }
    const loadProfileImage = async () => {
      try {
        const imageUrl = await getProfileImage(
          "profile-image.jpg",
          session.user.id
        );
        setProfileImage(imageUrl);
      } catch (error) {
        // Puedes agregar una imagen predeterminada en caso de error
        setProfileImage(session?.user?.imagen);
      }
    };

    loadProfileImage();
  }, [session]);

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  useEffect(() => {
    const checkStravaStatus = async () => {
      try {
        const res = await fetch("/api/strava/status");
        const data = await res.json();

        setStravaConnected(data.connected);
      } catch (error) { }
    };
    checkStravaStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-24 flex flex-col items-center text-foreground">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <h1 className="text-3xl font-medium w-full text-left">Perfil</h1>
        <ThemeToggle />
      </div>

      {/* Avatar */}
      <div className="w-[90%] bg-card border p-5 shadow-md rounded-[20px] flex flex-col items-center mb-4">
        <div onClick={() => setShowPreview(true)}>
          <img
            src={profileImage || session?.user.imagen}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover mb-4 shadow-md"
          />
        </div>
        <div className="">
          <span className="text-2xl w-full text-left ">
            {session?.user.firstname} {session?.user.lastname}{" "}
          </span>
        </div>
        <div className="text-sm text-[#666] capitalize">{formData.rol}</div>
      </div>

      <h2 className="text-sm text-[#989898]  mb-2 w-full text-left">
        Datos personales
      </h2>

      {/* Cards de Perfil */}
      <div className="w-full flex flex-col gap-1 mb-6">
        <div
          className="bg-card rounded-[30px] border p-4 flex items-center justify-between shadow-sm"
          onClick={() => router.push("/dashboard/profile/editar")}
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/icons/Users.svg"
              alt=""
              className="w-full h-full object-cover"
            />
            <span className="text-muted-foreground font-medium">Perfil</span>
          </div>
          <span className="text-muted-foreground text-[28px]">›</span>
        </div>
      </div>



      <div className="text-center pt-4">
        <button
          className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
          type="submit"
          onClick={handleSignOut}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Cerrando sesión" : "Cerrar sesión"}
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
        </button>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <img
            src={
              profileImage ||
              session?.user?.imagen ||
              `https://ui-avatars.com/api/?name=${session?.user?.firstname || "User"}&length=1&background=random&color=fff&size=128`
            }
            alt="Avatar grande"
            className="w-[350px] h-[400px] rounded-2xl object-cover shadow-lg"
          />
        </div>
      )}

      {/* Espacio para bottom nav */}
      <div className="mt-auto"></div>
    </div>
  );
}

export default ProfilePage;
