"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

function SkeletonCard() {


    return (
     <div className="w-full h-[180px] rounded-xl bg-gray-200 animate-pulse" />
  );
}

export default SkeletonCard;