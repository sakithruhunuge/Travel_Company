"use client";

import { useTravelRequest } from "@/context/TravelRequestContext";
import TravelRequestWizard from "./TravelRequestWizard";

export default function TravelRequestModal() {
  const { isFormModalOpen, closeFormModal, isDraftLoaded } = useTravelRequest();

  if (!isDraftLoaded || !isFormModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={closeFormModal}
    >
      <div
        className="relative bg-white rounded-3xl w-full max-w-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 animate-scale-up max-h-[90vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        {/* Close Button */}
        <button
          onClick={closeFormModal}
          type="button"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:scale-110 transition-all font-bold text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 cursor-pointer"
        >
          &times;
        </button>

        {/* Form Wizard */}
        <TravelRequestWizard isModal={true} />
      </div>
    </div>
  );
}
