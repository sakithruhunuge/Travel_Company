"use client";

import React, { useState, useMemo } from "react";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  DownOutlined,
  UpOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

export interface GuestNotesCardProps {
  rawNotes?: string;
  className?: string;
  title?: string;
  defaultExpanded?: boolean;
}

export interface SmartBadge {
  id: string;
  label: string;
  colorClass: string;
  icon?: string;
}

export function parseGuestNotes(raw?: string) {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return {
      cleanedText: "",
      destinations: [] as string[],
      badges: [] as SmartBadge[],
      bulletPoints: [] as string[],
      hasNotes: false,
    };
  }

  let cleaned = raw;

  // 1. Remove JSON code blocks
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, "").trim();

  // 2. Remove pricing breakdown and custom calculator headers
  cleaned = cleaned
    .replace(/### 🌟 Custom Calculator Specifications[\s\S]*?(?=### 📝|$)/gi, "")
    .replace(/### 💵 Invoice Cost Breakdown[\s\S]*?(?=### 📝|$)/gi, "")
    .replace(/### 📝 Traveler Special Requests\s*/gi, "")
    .trim();

  // 3. Remove raw markdown table syntax if any exists
  cleaned = cleaned
    .replace(/^\|.*?\|$/gm, "")
    .replace(/^\s*[-:| ]{3,}\s*$/gm, "")
    .trim();

  // 4. Extract Custom Destinations if present
  let destinations: string[] = [];
  const destMatch = cleaned.match(/Custom Destinations:\s*\[(.*?)\]/i);
  if (destMatch && destMatch[1]) {
    destinations = destMatch[1]
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    cleaned = cleaned.replace(/Custom Destinations:\s*\[.*?\]\s*/i, "").trim();
  }

  // 5. Check if user notes are virtually empty or "None"
  const normalized = cleaned.toLowerCase();
  const isNone =
    !cleaned ||
    normalized === "none" ||
    normalized === "none." ||
    normalized === "n/a" ||
    normalized === "nil" ||
    normalized === "-" ||
    normalized === "no special requests" ||
    normalized === "no";

  if (isNone && destinations.length === 0) {
    return {
      cleanedText: "",
      destinations: [],
      badges: [],
      bulletPoints: [],
      hasNotes: false,
    };
  }

  const finalHumanText = isNone ? "" : cleaned;

  // 6. Detect Operational Badges for instant crew scanning
  const badges: SmartBadge[] = [];

  // Flight & Airport
  const flightMatch = finalHumanText.match(/\b([A-Z]{2,3}\s*\d{2,4})\b/);
  const hasAirport = /airport|flight|landing|terminal|arrival|placard|name board|pickup at|drop off at/i.test(finalHumanText);
  if (flightMatch) {
    badges.push({
      id: "flight",
      label: `Flight: ${flightMatch[1].toUpperCase()}`,
      colorClass: "bg-sky-100/90 text-sky-800 border-sky-300",
      icon: "✈️",
    });
  } else if (hasAirport) {
    badges.push({
      id: "airport",
      label: "Airport Pickup / Drop-off",
      colorClass: "bg-sky-100/90 text-sky-800 border-sky-300",
      icon: "✈️",
    });
  }

  // Dietary
  if (/\bhalal\b/i.test(finalHumanText)) {
    badges.push({
      id: "halal",
      label: "Strictly Halal",
      colorClass: "bg-emerald-100/90 text-emerald-800 border-emerald-300",
      icon: "🥩",
    });
  }
  if (/\bvegetarian\b/i.test(finalHumanText)) {
    badges.push({
      id: "vegetarian",
      label: "Vegetarian Meals",
      colorClass: "bg-emerald-100/90 text-emerald-800 border-emerald-300",
      icon: "🥗",
    });
  }
  if (/\bvegan\b/i.test(finalHumanText)) {
    badges.push({
      id: "vegan",
      label: "Vegan",
      colorClass: "bg-emerald-100/90 text-emerald-800 border-emerald-300",
      icon: "🌱",
    });
  }
  if (/\bgluten\b/i.test(finalHumanText)) {
    badges.push({
      id: "gluten",
      label: "Gluten-Free",
      colorClass: "bg-amber-100/90 text-amber-800 border-amber-300",
      icon: "🌾",
    });
  }
  if (/\ballerg(y|ies|ic)\b/i.test(finalHumanText)) {
    badges.push({
      id: "allergy",
      label: "Allergy Alert",
      colorClass: "bg-rose-100/90 text-rose-800 border-rose-300",
      icon: "⚠️",
    });
  }

  // Child & Infant
  if (/\b(booster|car seat|baby seat|child seat)\b/i.test(finalHumanText)) {
    badges.push({
      id: "childseat",
      label: "Child / Booster Seat",
      colorClass: "bg-purple-100/90 text-purple-800 border-purple-300",
      icon: "👶",
    });
  } else if (/\b(infant|baby|toddler|stroller|cot)\b/i.test(finalHumanText)) {
    badges.push({
      id: "infant",
      label: "Traveling with Infant",
      colorClass: "bg-purple-100/90 text-purple-800 border-purple-300",
      icon: "👶",
    });
  }

  // Accessibility & Senior
  if (/\b(wheelchair|elderly|senior|mobility|walking difficulty|disability)\b/i.test(finalHumanText)) {
    badges.push({
      id: "accessibility",
      label: "Accessibility / Mobility Assistance",
      colorClass: "bg-indigo-100/90 text-indigo-800 border-indigo-300",
      icon: "♿",
    });
  }

  // Language & Guides
  const langMatch = finalHumanText.match(/\b(german|french|spanish|russian|italian|mandarin|chinese|japanese|arabic|hindi)\b/i);
  if (langMatch) {
    const langName = langMatch[1].charAt(0).toUpperCase() + langMatch[1].slice(1).toLowerCase();
    badges.push({
      id: "language",
      label: `${langName}-speaking Preference`,
      colorClass: "bg-teal-100/90 text-teal-800 border-teal-300",
      icon: "🗣️",
    });
  }

  // Luggage
  if (/\b(extra luggage|large bags|surfboard|golf|oversized)\b/i.test(finalHumanText)) {
    badges.push({
      id: "luggage",
      label: "Extra / Large Luggage",
      colorClass: "bg-amber-100/90 text-amber-800 border-amber-300",
      icon: "🧳",
    });
  }

  // Hotel & Stay
  if (/\b(early check[- ]?in|late check[- ]?out|interconnecting|connecting room|twin bed)\b/i.test(finalHumanText)) {
    badges.push({
      id: "hotel",
      label: "Hotel Accommodation Request",
      colorClass: "bg-blue-100/90 text-blue-800 border-blue-300",
      icon: "🏨",
    });
  }

  // 7. Parse bullet points vs paragraph text
  const rawLines = finalHumanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletPoints: string[] = [];
  const paragraphLines: string[] = [];

  for (const line of rawLines) {
    if (/^[-*•]\s+/.test(line)) {
      bulletPoints.push(line.replace(/^[-*•]\s+/, ""));
    } else if (/^\d+\.\s+/.test(line)) {
      bulletPoints.push(line.replace(/^\d+\.\s+/, ""));
    } else {
      paragraphLines.push(line);
    }
  }

  return {
    cleanedText: paragraphLines.join("\n\n"),
    destinations,
    badges,
    bulletPoints,
    hasNotes: Boolean(finalHumanText || destinations.length > 0),
  };
}

export default function GuestNotesCard({
  rawNotes,
  className = "",
  title = "Special Requests / Guest Notes",
  defaultExpanded = false,
}: GuestNotesCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const parsed = useMemo(() => parseGuestNotes(rawNotes), [rawNotes]);

  const handleCopy = async () => {
    if (!rawNotes) return;
    try {
      const copyText = parsed.cleanedText || rawNotes;
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy notes to clipboard:", err);
    }
  };

  // Case 1: No special requests or completely empty
  if (!parsed.hasNotes) {
    return (
      <div
        className={`bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 text-xs text-slate-500 flex items-center justify-between ${className}`}
      >
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-emerald-500 text-sm flex-shrink-0" />
          <span className="font-medium text-slate-600">
            <strong>{title}:</strong> Standard journey profile (No special requests or dietary restrictions).
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full border border-slate-200">
          Standard
        </span>
      </div>
    );
  }

  const isLong =
    (parsed.cleanedText && parsed.cleanedText.length > 240) ||
    parsed.bulletPoints.length > 3 ||
    (parsed.cleanedText && parsed.bulletPoints.length > 1);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/60 p-3.5 sm:p-4 text-xs shadow-sm backdrop-blur-sm ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-700">
            <FileTextOutlined className="text-xs" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 leading-none">
              {title}
            </h4>
            <span className="text-[10px] text-amber-700/80 font-medium">
              Verified Traveler Instructions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-white/70 hover:bg-white rounded-lg border border-amber-200/80 transition shadow-2xs"
            >
              <span>{isExpanded ? "Collapse" : "Expand"}</span>
              {isExpanded ? <UpOutlined className="text-[10px]" /> : <DownOutlined className="text-[10px]" />}
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy guest notes to clipboard"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-white/70 hover:bg-white rounded-lg border border-amber-200/80 transition shadow-2xs"
          >
            {copied ? (
              <>
                <CheckOutlined className="text-emerald-600 text-xs" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <CopyOutlined className="text-xs text-amber-700" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Smart Quick-Scan Badges */}
      {parsed.badges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {parsed.badges.map((badge) => (
            <span
              key={badge.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${badge.colorClass}`}
            >
              {badge.icon && <span>{badge.icon}</span>}
              <span>{badge.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Custom Destinations Route Sequence */}
      {parsed.destinations.length > 0 && (
        <div className="mb-3 bg-white/80 border border-amber-200/80 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <CompassOutlined className="text-amber-600" />
            <span>Custom Route Destinations ({parsed.destinations.length} Stops)</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {parsed.destinations.map((dest, idx) => (
              <React.Fragment key={idx}>
                <span className="inline-flex items-center gap-1 bg-amber-100/70 border border-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded-lg text-xs">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  {dest}
                </span>
                {idx < parsed.destinations.length - 1 && (
                  <span className="text-amber-400 font-bold text-xs">➔</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Structured Content Area */}
      <div
        className={`transition-all duration-300 space-y-2 text-slate-800 ${
          isLong && !isExpanded ? "line-clamp-3 overflow-hidden" : ""
        }`}
      >
        {/* Bullet points if user provided a list */}
        {parsed.bulletPoints.length > 0 && (
          <ul className="space-y-1.5 pl-0.5">
            {parsed.bulletPoints.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span className="font-semibold text-slate-900">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Clean Paragraph Body */}
        {parsed.cleanedText && (
          <div className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-line bg-white/60 p-2.5 rounded-xl border border-amber-100">
            {parsed.cleanedText}
          </div>
        )}
      </div>

      {/* Subtle Read More Link if truncated */}
      {isLong && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 group"
        >
          <span>Show full guest instructions</span>
          <DownOutlined className="text-[10px] group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
