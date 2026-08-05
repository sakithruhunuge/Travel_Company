"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useTravelRequest } from "@/context/TravelRequestContext";
import { useToast } from "@/context/ToastContext";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import StepIndicator from "@/components/ui/StepIndicator";
import ItineraryDisplay from "@/components/ItineraryDisplay";

const STEPS = ["Choose Escape", "Dates & Details", "Review & Submit"];

const ALL_DESTINATIONS = [
  { value: "Colombo", label: "Colombo" },
  { value: "Sigiriya", label: "Sigiriya" },
  { value: "Dambulla", label: "Dambulla" },
  { value: "Kandy", label: "Kandy" },
  { value: "Polonnaruwa", label: "Polonnaruwa" },
  { value: "Galle", label: "Galle" },
  { value: "Mirissa", label: "Mirissa" },
  { value: "Unawatuna", label: "Unawatuna" },
  { value: "Bentota", label: "Bentota" },
  { value: "Nuwara Eliya", label: "Nuwara Eliya" },
  { value: "Ella", label: "Ella" },
  { value: "Horton Plains", label: "Horton Plains" },
  { value: "Yala National Park", label: "Yala National Park" },
  { value: "Udawalawe", label: "Udawalawe" },
  { value: "Bundala", label: "Bundala" },
];

interface TravelRequestWizardProps {
  isModal?: boolean;
  onSubmit?: (payload: any) => Promise<void>;
}

export default function TravelRequestWizard({ isModal = false, onSubmit }: TravelRequestWizardProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const locale = useLocale();

  const {
    formData,
    packageMetadata,
    currentStep,
    setStep,
    updateFormField,
    selectPackageById,
    resetForm,
    closeFormModal,
    packages,
  } = useTravelRequest();
  const { addToast } = useToast();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // AI Pipeline Integration State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.packageId) {
        errors.packageId = "Please select a travel package or customized tour";
      }
      if (!formData.numberOfTravelers || formData.numberOfTravelers < 1) {
        errors.numberOfTravelers = "Number of travelers must be 1 or more";
      }
      if (formData.packageId === "custom" && formData.customDestinations.length === 0) {
        errors.customDestinations = "Please select at least one destination for your custom tour";
      }
    }

    if (step === 1) {
      if (!formData.preferredStartDate) {
        errors.preferredStartDate = "Preferred start date is required";
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        if (formData.preferredStartDate < todayStr) {
          errors.preferredStartDate = "Start date must be in the future";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleGenerateItinerary = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;

    const primaryDest = formData.customDestinations?.[0] || packageMetadata?.title?.split(" ")?.[0] || "Galle";
    const promptText = formData.specialRequests 
      ? `${formData.specialRequests} (Visiting ${primaryDest})`
      : `Looking for a customized tour to ${primaryDest} focusing on culture, beach, and sight-seeing`;

    const payload = {
      user_id: session?.user?.id || (session?.user?.email ? String(session.user.email) : "guest_user"),
      package_id: formData.packageId !== "custom" ? formData.packageId : null,
      selected_place_ids: formData.customDestinations || [],
      prompt: promptText,
      budget_tier: "Standard",
      duration_days: 3
    };

    if (onSubmit) {
      await onSubmit(payload);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        setGenerationError(errData.detail || "⚠️ Security block: Invalid or off-topic travel request.");
        return;
      }

      if (!res.ok) {
        setGenerationError("⚠️ Server error: Unable to generate itinerary. Please try again later.");
        return;
      }

      const data = await res.json();
      if (data.status === "success" && data.itinerary_markdown) {
        setGeneratedMarkdown(data.itinerary_markdown);
        addToast({
          type: "success",
          title: "Itinerary Created!",
          message: "Your AI-powered travel itinerary has been generated."
        });
      } else {
        setGenerationError("⚠️ Unexpected error receiving itinerary payload.");
      }
    } catch (err) {
      setGenerationError("⚠️ Unable to connect to AI generation server. Ensure FastAPI backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isAuthenticated = sessionStatus === "authenticated";

  // RENDER VIEW 1: AI ITINERARY DISPLAY VIEW
  if (generatedMarkdown) {
    return (
      <div className="py-6 px-4">
        <ItineraryDisplay
          markdownContent={generatedMarkdown}
          onReset={() => {
            setGeneratedMarkdown(null);
            setStep(0);
          }}
        />
      </div>
    );
  }

  // RENDER VIEW 2: AI AGENT GENERATION LOADING OVERLAY
  if (isGenerating) {
    return (
      <div className="py-20 px-6 text-center space-y-6 max-w-lg mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl animate-fade-in-up">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20 animate-ping" />
          <div className="w-20 h-20 rounded-full border-4 border-brand-primary border-t-transparent animate-spin flex items-center justify-center text-2xl">
            🌴
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-brand-dark tracking-tight">
            Crafting Your Sri Lanka Itinerary
          </h3>
          <p className="text-sm font-semibold text-brand-muted leading-relaxed">
            Our AI Agents are analyzing locations, calculating airport travel times, and tailoring recommendations...
          </p>
          <p className="text-xs text-brand-primary font-bold animate-pulse pt-2">
            This may take up to 30-45 seconds.
          </p>
        </div>
      </div>
    );
  }

  // RENDER VIEW 3: WIZARD FORM VIEW
  return (
    <div className={`bg-white rounded-3xl ${isModal ? "p-0" : "shadow-xl border border-slate-100 p-6 sm:p-10"} max-w-3xl mx-auto`}>
      <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={(s) => s < currentStep && setStep(s)} />

      {generationError && (
        <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
          <span className="text-base">⚠️</span>
          <span>{generationError}</span>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="ml-auto text-rose-500 hover:text-rose-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleGenerateItinerary} className="mt-8 space-y-8">
        {/* Step 0: Choose Escape */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-extrabold text-brand-dark">Choose Your Travel Escape</h3>
              <p className="text-xs text-brand-muted mt-1">Select a curated package template or customize your own itinerary.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => selectPackageById(pkg.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    formData.packageId === pkg.id
                      ? "border-brand-primary bg-brand-primary/5 shadow-md"
                      : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-brand-dark text-sm">{pkg.name}</span>
                      {formData.packageId === pkg.id && (
                        <span className="w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted font-semibold">{pkg.duration}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">From</span>
                    <span className="font-black text-brand-secondary">{pkg.priceRange}</span>
                  </div>
                </div>
              ))}

              {/* Custom Package Option */}
              <div
                onClick={() => selectPackageById("custom")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  formData.packageId === "custom"
                    ? "border-brand-primary bg-brand-primary/5 shadow-md"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-brand-dark text-sm">✨ Custom Tailored Tour</span>
                    {formData.packageId === "custom" && (
                      <span className="w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted font-semibold">Select your own destinations & preferences</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Flexibility</span>
                  <span className="font-black text-brand-primary">100% Personalized</span>
                </div>
              </div>
            </div>

            {formData.packageId === "custom" && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Target Destinations
                </label>
                <MultiSelect
                  options={ALL_DESTINATIONS}
                  value={formData.customDestinations}
                  onChange={(selected) => updateFormField("customDestinations", selected)}
                  placeholder="Select cities or regions (e.g. Galle, Sigiriya, Kandy)..."
                />
                {formErrors.customDestinations && (
                  <p className="text-xs text-rose-500 font-semibold">{formErrors.customDestinations}</p>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Number of Travelers
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.numberOfTravelers}
                onChange={(e) => updateFormField("numberOfTravelers", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        )}

        {/* Step 1: Dates & Details */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-extrabold text-brand-dark">Dates & Travel Preferences</h3>
              <p className="text-xs text-brand-muted mt-1">Specify your start date and any special requests for the AI trip planner.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Preferred Start Date
              </label>
              <DatePicker
                value={formData.preferredStartDate}
                onChange={(val) => updateFormField("preferredStartDate", val)}
              />
              {formErrors.preferredStartDate && (
                <p className="text-xs text-rose-500 font-semibold">{formErrors.preferredStartDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Vibe & Special Requests (AI Input Prompt)
              </label>
              <textarea
                rows={4}
                value={formData.specialRequests}
                onChange={(e) => updateFormField("specialRequests", e.target.value)}
                placeholder="Describe your ideal vibe (e.g. Quiet ocean view resort, heritage fort walks, seafood dining, pool)..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Step 2: Review & Submit */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-extrabold text-brand-dark">Review & Generate AI Itinerary</h3>
              <p className="text-xs text-brand-muted mt-1">Confirm details to trigger the 3-Agent AI Generation engine.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-xxs">Package Selection</span>
                <span className="font-extrabold text-brand-dark">{packageMetadata?.title || "Custom Tour"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-xxs">Travelers</span>
                <span className="font-extrabold text-brand-dark">{formData.numberOfTravelers} Guest(s)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-xxs">Preferred Start Date</span>
                <span className="font-extrabold text-brand-dark">{formData.preferredStartDate || "Flexible"}</span>
              </div>
              {formData.specialRequests && (
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-xxs mb-1">AI Prompt / Notes</span>
                  <p className="italic text-slate-600 bg-white p-3 rounded-xl border border-slate-200/50">
                    &quot;{formData.specialRequests}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isGenerating}
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Back
            </button>
          ) : isModal ? (
            <button
              type="button"
              onClick={closeFormModal}
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/"
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all"
            >
              Cancel
            </Link>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white text-sm font-extrabold rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white text-sm font-extrabold rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer ml-auto flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? "Crafting Itinerary..." : "Generate AI Itinerary 🚀"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
