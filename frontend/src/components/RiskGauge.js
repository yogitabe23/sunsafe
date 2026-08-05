import React from "react";

const RISK_CONFIG = {
  Low: { color: "#10B981", text: "text-green-700", percentage: 25 },
  Moderate: { color: "#F59E0B", text: "text-amber-700", percentage: 50 },
  High: { color: "#EF4444", text: "text-red-700", percentage: 75 },
  Extreme: { color: "#991B1B", text: "text-red-900", percentage: 100 },
};

export const RiskGauge = ({ risk = "Moderate", size = 200 }) => {
  const config = RISK_CONFIG[risk] || RISK_CONFIG.Moderate;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (config.percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center" data-testid="risk-gauge">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth="12" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Risk Level</p>
          <p className={`text-2xl font-bold ${config.text}`}>{risk}</p>
        </div>
      </div>
    </div>
  );
};
