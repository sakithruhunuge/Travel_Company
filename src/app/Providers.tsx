"use client";

import { SessionProvider } from "next-auth/react";
import { TravelRequestProvider } from "@/context/TravelRequestContext";
import TravelRequestModal from "@/components/TravelRequestModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TravelRequestProvider>
        {children}
        <TravelRequestModal />
      </TravelRequestProvider>
    </SessionProvider>
  );
}
