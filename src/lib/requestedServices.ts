import { parseSpecifications } from "@/lib/pricingParser";

export interface RequestedServices {
  driverRequested: boolean;
  driverReason?: string;
  driverAssigned: boolean;
  driverName?: string;
  driverEmail?: string;
  driverPhone?: string;

  guideRequested: boolean;
  guideReason?: string;
  guideAssigned: boolean;
  guideName?: string;
  guideEmail?: string;
  guidePhone?: string;

  hasAnyServiceRequested: boolean;
}

/**
 * Robustly detects whether the customer requested a car driver or tour guide
 * across pricing inputs, calculator specifications, traveler notes, and booking data.
 */
export function detectRequestedServices(request: any): RequestedServices {
  if (!request) {
    return {
      driverRequested: false,
      driverAssigned: false,
      guideRequested: false,
      guideAssigned: false,
      hasAnyServiceRequested: false,
    };
  }

  const specialReqs = request.specialRequests || "";
  const pricingInputs = request.pricingInputs || {};
  const specs = parseSpecifications(specialReqs);

  // Driver Assignment status
  const driverAssigned = Boolean(request.driver?.name && request.driver.name.trim().length > 0);
  const driverName = request.driver?.name;
  const driverEmail = request.driver?.email;
  const driverPhone = request.driver?.phone;

  // Guide Assignment status
  const guideAssigned = Boolean(request.tourGuide?.name && request.tourGuide.name.trim().length > 0);
  const guideName = request.tourGuide?.name;
  const guideEmail = request.tourGuide?.email;
  const guidePhone = request.tourGuide?.phone;

  // 1. Detect Driver Request
  let driverRequested = false;
  let driverReason: string | undefined;

  if (pricingInputs.transportMode === "private-driver") {
    driverRequested = true;
    driverReason = "Selected Private Car & Local Driver in tour customizer";
  } else if (specs.transportMode && /driver|private car/i.test(specs.transportMode)) {
    driverRequested = true;
    driverReason = `Specification: ${specs.transportMode}`;
  } else if (/Transport Mode.*?(driver|private car)/i.test(specialReqs)) {
    driverRequested = true;
    driverReason = "Selected Private Driver in booking specifications";
  } else if (
    /\b(car driver|private driver|chauffeur|need a driver|require a driver|driver needed|with driver|hire a driver)\b/i.test(
      specialReqs
    )
  ) {
    driverRequested = true;
    driverReason = "Customer requested driver in special requests";
  } else if (driverAssigned) {
    driverRequested = true;
    driverReason = "Driver currently assigned to booking";
  }

  // 2. Detect Tour Guide Request
  let guideRequested = false;
  let guideReason: string | undefined;

  const addOnsList = Array.isArray(pricingInputs.addOns) ? pricingInputs.addOns : [];
  if (addOnsList.includes("guide")) {
    guideRequested = true;
    guideReason = "Selected Private Tour Guide in add-ons";
  } else if (specs.addOns && /guide/i.test(specs.addOns)) {
    guideRequested = true;
    guideReason = `Specification: ${specs.addOns}`;
  } else if (/Selected Add-ons.*?guide/i.test(specialReqs)) {
    guideRequested = true;
    guideReason = "Selected Tour Guide in booking add-ons";
  } else if (
    /\b(tour guide|private guide|english guide|need a guide|require a guide|guide needed|with guide|hire a guide)\b/i.test(
      specialReqs
    )
  ) {
    guideRequested = true;
    guideReason = "Customer requested tour guide in special requests";
  } else if (guideAssigned) {
    guideRequested = true;
    guideReason = "Tour guide currently assigned to booking";
  }

  return {
    driverRequested,
    driverReason,
    driverAssigned,
    driverName,
    driverEmail,
    driverPhone,

    guideRequested,
    guideReason,
    guideAssigned,
    guideName,
    guideEmail,
    guidePhone,

    hasAnyServiceRequested: driverRequested || guideRequested,
  };
}
