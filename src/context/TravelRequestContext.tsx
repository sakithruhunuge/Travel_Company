"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { sriLankaPackages } from "@/data/packages";

export interface TravelRequestFormData {
  packageId: string;
  packageName: string;
  numberOfTravelers: number;
  preferredStartDate: string;
  specialRequests: string;
  customDestinations: string[];
}

export interface PackageMetadata {
  duration: string;
  priceRange: string;
  destinations: string[];
}

interface TravelRequestContextType {
  formData: TravelRequestFormData;
  packageMetadata: PackageMetadata | null;
  currentStep: number;
  setStep: (step: number) => void;
  updateFormField: (name: keyof TravelRequestFormData, value: TravelRequestFormData[keyof TravelRequestFormData]) => void;
  selectPackageById: (id: string) => void;
  resetForm: () => void;
  isDraftLoaded: boolean;
  isFormModalOpen: boolean;
  openFormModal: (packageId?: string) => void;
  closeFormModal: () => void;
}

const defaultFormData: TravelRequestFormData = {
  packageId: "",
  packageName: "",
  numberOfTravelers: 1,
  preferredStartDate: "",
  specialRequests: "",
  customDestinations: [],
};

const TravelRequestContext = createContext<TravelRequestContextType | undefined>(undefined);

export function TravelRequestProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [formData, setFormData] = useState<TravelRequestFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Load package metadata helper
  const getPackageMetadata = (pkgId: string): PackageMetadata | null => {
    if (!pkgId || pkgId === "custom") return null;
    const pkg = sriLankaPackages.find((p) => p.id === pkgId);
    if (!pkg) return null;
    return {
      duration: pkg.duration,
      priceRange: pkg.priceRange,
      destinations: pkg.destinations,
    };
  };

  // 1. Load draft from sessionStorage on mount
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem("travel_request_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) {
          setFormData({
            ...defaultFormData,
            ...parsed.formData,
          });
        }
        if (parsed.currentStep !== undefined) {
          setCurrentStep(parsed.currentStep);
        }
        // Do not auto-open on login or signup pages on initial mount
        if (parsed.isFormModalOpen !== undefined && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
          setIsFormModalOpen(parsed.isFormModalOpen);
        }
      }
    } catch (e) {
      console.error("Failed to load travel request draft from sessionStorage:", e);
    } finally {
      setIsDraftLoaded(true);
    }
  }, []);

  // 2. Listen to route transitions to dynamically manage the modal visibility (e.g. closing on login page, opening when redirected back)
  useEffect(() => {
    if (!isDraftLoaded) return;

    if (pathname === "/login" || pathname === "/signup") {
      setIsFormModalOpen(false);
    } else {
      try {
        const savedDraft = sessionStorage.getItem("travel_request_draft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.isFormModalOpen === true) {
            setIsFormModalOpen(true);
          }
        }
      } catch (e) {
        console.error("Failed to restore modal state on path change:", e);
      }
    }
  }, [pathname, isDraftLoaded]);

  // 3. Persist draft to sessionStorage on state changes
  useEffect(() => {
    if (!isDraftLoaded) return;
    try {
      sessionStorage.setItem(
        "travel_request_draft",
        JSON.stringify({ formData, currentStep, isFormModalOpen })
      );
    } catch (e) {
      console.error("Failed to save travel request draft to sessionStorage:", e);
    }
  }, [formData, currentStep, isFormModalOpen, isDraftLoaded]);

  const setStep = (step: number) => {
    setCurrentStep(step);
  };

  const updateFormField = (
    name: keyof TravelRequestFormData,
    value: TravelRequestFormData[keyof TravelRequestFormData]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectPackageById = (id: string) => {
    if (!id) {
      setFormData((prev) => ({
        ...prev,
        packageId: "",
        packageName: "",
        customDestinations: [],
      }));
      return;
    }

    if (id === "custom") {
      setFormData((prev) => ({
        ...prev,
        packageId: "custom",
        packageName: "Custom Sri Lanka Tour",
      }));
      return;
    }

    const pkg = sriLankaPackages.find((p) => p.id === id);
    if (pkg) {
      setFormData((prev) => ({
        ...prev,
        packageId: pkg.id,
        packageName: pkg.name,
        customDestinations: [], // Clear custom destinations if a pre-defined package is chosen
      }));
    }
  };

  const openFormModal = (packageId?: string) => {
    if (packageId) {
      selectPackageById(packageId);
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setCurrentStep(0);
    setIsFormModalOpen(false);
    try {
      sessionStorage.removeItem("travel_request_draft");
    } catch (e) {
      console.error("Failed to clear travel request draft from sessionStorage:", e);
    }
  };

  const packageMetadata = getPackageMetadata(formData.packageId);

  return (
    <TravelRequestContext.Provider
      value={{
        formData,
        packageMetadata,
        currentStep,
        setStep,
        updateFormField,
        selectPackageById,
        resetForm,
        isDraftLoaded,
        isFormModalOpen,
        openFormModal,
        closeFormModal,
      }}
    >
      {children}
    </TravelRequestContext.Provider>
  );
}

export function useTravelRequest() {
  const context = useContext(TravelRequestContext);
  if (!context) {
    throw new Error("useTravelRequest must be used within a TravelRequestProvider");
  }
  return context;
}
