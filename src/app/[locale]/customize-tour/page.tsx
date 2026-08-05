import UnifiedAITripWorkspace from "@/components/UnifiedAITripWorkspace";

export const metadata = {
  title: "Unified AI Trip Workspace - Sri Lanka Travel",
  description: "AI Agent Trip Planner & Interactive Real-Time Map Workspace for Sri Lanka travel.",
};

export default function CustomizeTourPage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/20 to-indigo-50/30 py-10 px-4 sm:px-6 lg:px-8">
      <UnifiedAITripWorkspace />
    </div>
  );
}
