"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CompassOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTourGuideDestination,
  DestinationGuideInfo,
} from "@/constants/tourGuideDestinations";
import { getDistanceBetween } from "@/lib/distanceMatrix";

interface TourGuidePlacesListProps {
  destinations: string[];
  primaryColor?: string;
  isGuideRole?: boolean;
  className?: string;
}

export default function TourGuidePlacesList({
  destinations = [],
  primaryColor = "#0B7C8A",
  isGuideRole = true,
  className = "",
}: TourGuidePlacesListProps) {
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");
  const [expandedStopIdx, setExpandedStopIdx] = useState<number | null>(null);

  // Normalize stops to destination guide objects
  const placesInfo: { stopIdx: number; info: DestinationGuideInfo }[] =
    React.useMemo(() => {
      return destinations.map((dest, idx) => ({
        stopIdx: idx + 1,
        info: getTourGuideDestination(dest),
      }));
    }, [destinations]);

  if (placesInfo.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border border-white/60 backdrop-blur-xl shadow-sm overflow-hidden transition-all ${className}`}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.75)",
      }}
    >
      {/* Header Bar */}
      <div
        className="p-4 sm:p-5 border-b border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, ${primaryColor}08 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg text-white shadow-sm shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <CompassOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: `${primaryColor}14`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}30`,
                }}
              >
                {isGuideRole ? "Tour Guide Itinerary Briefing" : "Trip Stops & Destination Highlights"}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {placesInfo.length} {placesInfo.length === 1 ? "Assigned Destination" : "Assigned Places to Visit"}
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              Places You Have to Go & Cultural Briefings
            </h4>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              viewMode === "cards"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Card View with Photos and Full Descriptions"
          >
            <AppstoreOutlined />
            <span>Detailed Cards</span>
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              viewMode === "timeline"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Timeline Journey Sequence"
          >
            <UnorderedListOutlined />
            <span>Journey Sequence</span>
          </button>
        </div>
      </div>

      {/* Guide Banner Advice */}
      <div
        className="px-4 sm:px-5 py-2.5 border-b border-white/60 text-xs flex items-center gap-2"
        style={{
          backgroundColor: `${primaryColor}08`,
          color: primaryColor,
        }}
      >
        <InfoCircleOutlined className="shrink-0" />
        <span className="font-medium text-[11px] leading-relaxed">
          {isGuideRole
            ? "Here are all the locations requested by your travelers. Review the briefs, key historical highlights, and talking points below before welcoming guests at each stop."
            : "Review the full sequence of destination stops, cultural descriptions, and route highlights scheduled for this booking."}
        </span>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5">
        <AnimatePresence mode="wait">
          {viewMode === "cards" ? (
            /* Detailed Cards Grid */
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {placesInfo.map((item, idx) => {
                const { stopIdx, info } = item;
                const nextItem = placesInfo[idx + 1];
                const legDistance = nextItem
                  ? getDistanceBetween(info.name, nextItem.info.name)
                  : null;
                const isExpanded = expandedStopIdx === idx;

                return (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-slate-200/80 bg-white/80 hover:bg-white backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Banner with Badges */}
                      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                        <Image
                          src={info.image}
                          alt={info.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                        {/* Top Left Stop Pill */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span
                            className="px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <EnvironmentOutlined />
                            <span>
                              {idx === 0
                                ? "Stop 1 • Starting Point"
                                : idx === placesInfo.length - 1
                                ? `Stop ${stopIdx} • Final Destination`
                                : `Stop ${stopIdx}`}
                            </span>
                          </span>
                        </div>

                        {/* Top Right Category Pill */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white bg-slate-900/70 backdrop-blur-md border border-white/20 shadow-xs">
                            {info.category}
                          </span>
                        </div>

                        {/* Bottom Overlay Title & Region */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                            {info.region} • Sri Lanka
                          </span>
                          <h4 className="text-xl font-black text-white tracking-tight leading-tight">
                            {info.name}
                          </h4>
                          <p className="text-xs text-slate-200 font-medium line-clamp-1 mt-0.5">
                            {info.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Brief Description */}
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Destination Overview
                          </span>
                          <p className="text-xs leading-relaxed text-slate-700 font-normal">
                            {info.briefDescription}
                          </p>
                        </div>

                        {/* Key Highlights to Point Out */}
                        {info.keyHighlights && info.keyHighlights.length > 0 && (
                          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1">
                              <EyeOutlined style={{ color: primaryColor }} />
                              Key Sights & Attractions
                            </span>
                            <ul className="space-y-1">
                              {info.keyHighlights.slice(0, 3).map((sight, sIdx) => (
                                <li
                                  key={sIdx}
                                  className="text-[11px] text-slate-700 flex items-start gap-1.5 font-medium"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                                    style={{ backgroundColor: primaryColor }}
                                  />
                                  <span>{sight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Expandable Guide Talking Points */}
                        <div>
                          <button
                            onClick={() => setExpandedStopIdx(isExpanded ? null : idx)}
                            className="w-full flex items-center justify-between py-1.5 text-xs font-bold transition"
                            style={{ color: primaryColor }}
                          >
                            <span className="flex items-center gap-1.5">
                              <BulbOutlined />
                              <span>Guide Talking Points & Field Tips</span>
                            </span>
                            <span className="text-[10px] font-black">
                              {isExpanded ? "Hide Details ▲" : "View Talking Points ▼"}
                            </span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pt-2 space-y-2.5"
                              >
                                {info.guideTalkingPoints && info.guideTalkingPoints.length > 0 && (
                                  <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-xs space-y-1.5">
                                    <span className="font-bold text-teal-900 block text-[11px]">
                                      🗣️ What to Explain to Your Travelers:
                                    </span>
                                    {info.guideTalkingPoints.map((pt, pIdx) => (
                                      <p
                                        key={pIdx}
                                        className="text-[11px] text-teal-950 leading-relaxed pl-2 border-l-2 border-teal-300"
                                      >
                                        {pt}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {info.visitorTips && (
                                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-2">
                                    <SafetyCertificateOutlined className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-amber-900 block text-[10px] uppercase">
                                        Traveler Advisory / Dress Code
                                      </span>
                                      <p className="text-[11px] text-amber-950 mt-0.5">
                                        {info.visitorTips}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Leg Transition Footer */}
                    {nextItem && legDistance && (
                      <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span>Next stop:</span>
                          <strong className="text-slate-800">{nextItem.info.name}</strong>
                        </span>
                        <span
                          className="font-bold px-2 py-0.5 rounded-lg text-[10px]"
                          style={{
                            backgroundColor: `${primaryColor}14`,
                            color: primaryColor,
                          }}
                        >
                          ➔ ~{legDistance.distanceKm} km
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* Timeline Sequence View */
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 pl-2"
            >
              {placesInfo.map((item, idx) => {
                const { stopIdx, info } = item;
                const nextItem = placesInfo[idx + 1];
                const legDistance = nextItem
                  ? getDistanceBetween(info.name, nextItem.info.name)
                  : null;

                return (
                  <div key={idx} className="relative pl-9 space-y-2">
                    {/* Circle Pin on Timeline */}
                    <div
                      className="absolute left-3.5 -translate-x-1/2 top-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {stopIdx}
                    </div>

                    {/* Timeline Card */}
                    <div className="p-4 rounded-2xl bg-white/85 border border-slate-200/80 shadow-xs hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">
                              {info.name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {info.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {info.tagline}
                          </p>
                        </div>

                        {legDistance && (
                          <span
                            className="text-[11px] font-bold px-2.5 py-1 rounded-xl self-start sm:self-auto"
                            style={{
                              backgroundColor: `${primaryColor}14`,
                              color: primaryColor,
                            }}
                          >
                            Leg distance: ~{legDistance.distanceKm} km
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs leading-relaxed text-slate-700 font-normal mt-2.5">
                        {info.briefDescription}
                      </p>

                      {/* Quick Highlights Row */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        {info.keyHighlights.map((sight, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700"
                          >
                            <CheckCircleOutlined style={{ color: primaryColor }} />
                            <span>{sight}</span>
                          </span>
                        ))}
                      </div>

                      {/* Advisory Notice */}
                      {info.visitorTips && (
                        <div className="mt-2.5 text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl border border-amber-200/70">
                          <strong>Guide Advisory:</strong> {info.visitorTips}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
