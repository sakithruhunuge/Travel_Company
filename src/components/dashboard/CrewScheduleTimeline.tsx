"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarOutlined,
  CarOutlined,
  UserSwitchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

interface CrewMember {
  _id: string;
  name: string;
  role: string;
  languages?: string[];
  vehicleDetails?: { model: string; plateNumber: string };
  rating?: number;
}

interface TourBooking {
  _id: string;
  tourId?: string;
  packageName: string;
  userName: string;
  preferredStartDate: string;
  status: string;
  driver?: { name?: string };
  tourGuide?: { name?: string };
}

interface CrewScheduleTimelineProps {
  tours: TourBooking[];
  onSelectTour?: (tour: TourBooking) => void;
}

export default function CrewScheduleTimeline({
  tours,
  onSelectTour,
}: CrewScheduleTimelineProps) {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [startDateOffset, setStartDateOffset] = useState(0); // in days from today
  const [filterRole, setFilterRole] = useState<"all" | "driver" | "tour_guide">("all");

  useEffect(() => {
    fetch("/api/driver-guide")
      .then((res) => res.json())
      .then((data) => {
        if (data.crew) setCrew(data.crew);
      })
      .catch((err) => console.warn("Could not load crew roster:", err));
  }, []);

  // Generate 14-day window
  const daysToShow = 14;
  const today = new Date();
  const timelineDates: Date[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + startDateOffset + i);
    timelineDates.push(d);
  }

  const filteredCrew = crew.filter((c) => {
    if (filterRole === "all") return true;
    if (filterRole === "driver") return c.role === "driver" || c.role === "both";
    if (filterRole === "tour_guide") return c.role === "tour_guide" || c.role === "both";
    return true;
  });

  // Check if a tour matches crew and date
  const getAssignmentForCrewDay = (crewName: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const matchingTours = tours.filter((t) => {
      const isDriver = t.driver?.name?.toLowerCase() === crewName.toLowerCase();
      const isGuide = t.tourGuide?.name?.toLowerCase() === crewName.toLowerCase();
      if (!isDriver && !isGuide) return false;

      // Tour duration dynamically calculated from booking inputs
      const durationDays = Number((t as any).pricingInputs?.duration || (t as any).pricingInputs?.numberOfDays) || 5;
      const start = new Date(t.preferredStartDate);
      const end = new Date(start);
      end.setDate(start.getDate() + Math.max(0, durationDays - 1));

      return date >= start && date <= end;
    });

    return matchingTours;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarOutlined className="text-[#0B7C8A]" />
            <span>Driver & Tour Guide Schedule Timeline (Gantt View)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Visual resource roster across calendar dates with real-time double-booking conflict detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl outline-none"
          >
            <option value="all">All Personnel</option>
            <option value="driver">Chauffeurs Only</option>
            <option value="tour_guide">Tour Guides Only</option>
          </select>

          {/* Date Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStartDateOffset((prev) => prev - 7)}
              className="p-1 rounded-lg hover:bg-white text-slate-600 text-xs transition"
              title="Previous 7 Days"
            >
              <LeftOutlined />
            </button>
            <button
              onClick={() => setStartDateOffset(0)}
              className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={() => setStartDateOffset((prev) => prev + 7)}
              className="p-1 rounded-lg hover:bg-white text-slate-600 text-xs transition"
              title="Next 7 Days"
            >
              <RightOutlined />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Timeline Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-2.5 w-48 text-xs font-bold text-slate-600 bg-slate-50 rounded-l-xl">
                Crew Member
              </th>
              {timelineDates.map((date, idx) => {
                const isToday = date.toDateString() === today.toDateString();
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = date.getDate();

                return (
                  <th
                    key={idx}
                    className={`p-1 text-center text-[10px] font-bold border-l border-slate-100 ${
                      isToday ? "bg-teal-50/80 text-[#0B7C8A]" : "text-slate-500"
                    }`}
                  >
                    <div>{dayName}</div>
                    <div className={`text-xs font-extrabold ${isToday ? "text-[#0B7C8A]" : "text-slate-800"}`}>
                      {dayNum}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredCrew.map((person) => {
              return (
                <tr key={person._id} className="hover:bg-slate-50/60 transition">
                  {/* Crew Member Info Column */}
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {person.role === "driver" ? (
                        <CarOutlined className="text-teal-600" />
                      ) : (
                        <UserSwitchOutlined className="text-indigo-600" />
                      )}
                      <span>{person.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {person.vehicleDetails?.plateNumber || person.languages?.slice(0, 2).join(", ")}
                    </div>
                  </td>

                  {/* 14 Calendar Day Cells */}
                  {timelineDates.map((date, dateIdx) => {
                    const assignedTours = getAssignmentForCrewDay(person.name, date);
                    const isBooked = assignedTours.length > 0;
                    const hasConflict = assignedTours.length > 1;

                    return (
                      <td
                        key={dateIdx}
                        className="p-1 border-l border-slate-100 text-center relative h-12 align-middle"
                      >
                        {isBooked ? (
                          <div
                            onClick={() => onSelectTour && onSelectTour(assignedTours[0])}
                            className={`p-1 rounded-lg text-[9.5px] font-bold cursor-pointer transition shadow-xs overflow-hidden text-ellipsis whitespace-nowrap ${
                              hasConflict
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-teal-100/80 text-teal-900 border border-teal-200 hover:bg-teal-200"
                            }`}
                            title={
                              hasConflict
                                ? `CONFLICT: Multiple tours assigned (${assignedTours.map((t) => t.tourId || t.packageName).join(", ")})`
                                : `Assigned to: ${assignedTours[0].tourId || assignedTours[0].packageName} (${assignedTours[0].userName})`
                            }
                          >
                            {hasConflict ? (
                              <span className="flex items-center justify-center gap-1">
                                <ExclamationCircleOutlined className="text-rose-600" />
                                <span>Conflict ({assignedTours.length})</span>
                              </span>
                            ) : (
                              <span>{assignedTours[0].tourId || "Tour Active"}</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                            •
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-teal-100 border border-teal-300 inline-block" />
          <span>Assigned & Available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300 inline-block" />
          <span>Double-Booking Conflict Flag</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-slate-300">•</span>
          <span>Open Day (Unassigned)</span>
        </span>
      </div>
    </div>
  );
}
