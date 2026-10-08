"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DriverDispatchDashboard from "@/components/dashboard/DriverDispatchDashboard";

export default function DriverPortalPage() {
  return (
    <DashboardLayout>
      <DriverDispatchDashboard />
    </DashboardLayout>
  );
}
