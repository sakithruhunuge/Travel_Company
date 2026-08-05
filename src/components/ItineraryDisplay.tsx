"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ItineraryDisplayProps {
  markdownContent: string;
  onReset?: () => void;
}

export default function ItineraryDisplay({
  markdownContent,
  onReset,
}: ItineraryDisplayProps) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 space-y-8 animate-fade-in-up">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Travel Itinerary Generated
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">
            Your Custom Sri Lanka Tour Plan
          </h2>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer shadow-sm self-start sm:self-auto flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Start Over
          </button>
        )}
      </div>

      {/* Markdown Content Container */}
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p({ children, ...props }) {
              const textContent = React.Children.toArray(children).join("");
              if (textContent.includes("💡 Why This Was Chosen:") || textContent.includes("💡")) {
                return (
                  <div className="my-4 p-4 sm:p-5 bg-amber-50/90 border-l-4 border-amber-500 rounded-r-2xl shadow-sm text-amber-950 text-sm leading-relaxed font-medium">
                    {children}
                  </div>
                );
              }
              return <p {...props}>{children}</p>;
            },
            li({ children, ...props }) {
              const textContent = React.Children.toArray(children).join("");
              if (textContent.includes("💡 Why This Was Chosen:") || textContent.includes("💡")) {
                return (
                  <div className="my-3 p-4 bg-amber-50/90 border-l-4 border-amber-500 rounded-r-xl text-amber-950 text-sm font-medium leading-relaxed">
                    {children}
                  </div>
                );
              }
              return <li className="my-1 text-slate-700" {...props}>{children}</li>;
            },
            h1({ children }) {
              return <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight mt-2 mb-4">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight mt-8 mb-4 pb-2 border-b border-slate-100">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-lg font-bold text-brand-secondary mt-6 mb-3">{children}</h3>;
            },
            h4({ children }) {
              return <h4 className="text-base font-bold text-slate-800 mt-4 mb-2">{children}</h4>;
            },
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 font-semibold">
          ✨ Powered by Sri Lanka Travel AI Engine & Scraper DB
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-sm rounded-full shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer text-center"
          >
            Create Another Custom Tour
          </button>
        )}
      </div>
    </div>
  );
}
