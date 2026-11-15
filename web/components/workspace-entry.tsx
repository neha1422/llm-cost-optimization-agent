"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import GuidedDemo from "./guided-demo";
const EngineeringWorkspace = dynamic(() => import("./workspace"), {
  loading: () => (
    <p className="guide-route-loading">Loading engineering details…</p>
  ),
});
const FullComparison = dynamic(() => import("./experiments"), {
  loading: () => (
    <p className="guide-route-loading">Loading full comparison…</p>
  ),
});
export default function WorkspaceEntry({
  comparison = false,
}: {
  comparison?: boolean;
}) {
  const [advanced, setAdvanced] = useState<boolean | null>(null);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setAdvanced(
      comparison
        ? query.get("details") === "1"
        : [
            "Overview",
            "Ticket playground",
            "Pipeline",
            "Cost analytics",
            "Knowledge base",
            "Benchmarks",
            "Architecture",
          ].includes(query.get("view") || ""),
    );
  }, [comparison]);
  if (advanced === null)
    return <div className="guide-route-loading">Getting the demo ready…</div>;
  return advanced ? (
    comparison ? (
      <FullComparison />
    ) : (
      <EngineeringWorkspace />
    )
  ) : (
    <GuidedDemo initialTab={comparison ? "compare" : "try"} />
  );
}
