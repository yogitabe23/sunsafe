import React from "react";
import { RiskGauge } from "./RiskGauge";
import { Shield, Clock, TrendingUp, AlertTriangle } from "lucide-react";

export const RecommendationCard = ({ prediction }) => {
  if (!prediction) {
    return (
      <div className="glass-card rounded-3xl p-8 col-span-full md:col-span-2 gradient-hero" data-testid="empty-recommendation">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-800 mb-2">
            Get Your Sunscreen Recommendation
          </h2>
          <p className="text-slate-600">
            Fill in your profile details to receive personalized AI-powered sun protection advice
          </p>
        </div>
      </div>
    );
  }

  const shouldApply = prediction.apply === 1;

  return (
    <div className="glass-card rounded-3xl p-8 col-span-full md:col-span-2 gradient-hero" data-testid="recommendation-card">
      {prediction.risk === "Extreme" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Extreme UV Alert</p>
            <p className="text-sm text-red-700">Apply SPF {prediction.spf} immediately before going outside</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
        <div className="flex-1 text-center lg:text-left">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-2">
            Today's Recommendation
          </p>
          <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-800 mb-4">
            {shouldApply ? (
              <span data-testid="recommendation-apply">
                Apply SPF <span className="font-bold">{prediction.spf}</span>
              </span>
            ) : (
              <span data-testid="recommendation-no-apply">No Sunscreen Needed</span>
            )}
          </h2>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="neumorphic-card rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs uppercase tracking-widest text-slate-500">Confidence</p>
              </div>
              <p className="text-3xl font-bold text-slate-800" data-testid="confidence-value">{prediction.confidence}%</p>
            </div>

            <div className="neumorphic-card rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <p className="text-xs uppercase tracking-widest text-slate-500">Reapply</p>
              </div>
              <p className="text-3xl font-bold text-slate-800" data-testid="reapply-value">{prediction.reapply_min}m</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <RiskGauge risk={prediction.risk} size={200} />
        </div>
      </div>

      {prediction.reason?.length > 0 && (
        <div className="mt-6 p-6 bg-white/50 rounded-2xl border border-white/60">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-3">
            Why this recommendation?
          </p>
          <div className="space-y-2" data-testid="prediction-reasons">
            {prediction.reason.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <p className="text-slate-700">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
