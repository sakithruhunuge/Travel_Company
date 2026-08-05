"use client";

import React from "react";
import UnifiedAITripWorkspace from "@/components/UnifiedAITripWorkspace";

export default function CustomizeTourContainer() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/20 to-indigo-50/30 py-10 px-4 sm:px-6 lg:px-8">
      <UnifiedAITripWorkspace />
    </div>
  );
}
