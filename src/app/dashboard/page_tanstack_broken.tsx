"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import PushManager from "../../components/PushManager";
import { MiPanelSection } from "@/components/Dashboard/MiPanelSection";
import { MisMatchSection } from "@/components/Dashboard/MisMatchSection";
import { MisFavoritosSection } from "@/components/Dashboard/MisFavoritosSection";
import { Toaster } from "react-hot-toast";

const categories = [
  { label: "Mi panel" },
  { label: "Mis match" },
  { label: "Mis favoritos" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);

  // Redireccionar si no hay sesión
  if (status === "loading") {
    return (
      <div className="w-[390px] min-h-screen bg-[#FEFBF9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C95100]"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const renderContent = () => {
    switch (activeCategory) {
      case 0:
        return <MiPanelSection />;
      case 1:
        return <MisMatchSection />;
      case 2:
        return <MisFavoritosSection />;
      default:
        return <MiPanelSection />;
    }
  };

  return (
    <div className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <Toaster position="top-center" />
      
      {/* Header */}
      <TopContainer selectedLocalidad setSelectedLocalidad  />
      
      {/* Push Manager */}
      <PushManager />

      {/* Main Content */}
      <div className="px-4">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(index)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeCategory === index
                    ? "bg-[#C95100] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          
          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-[100px]"></div>
    </div>
  );
}