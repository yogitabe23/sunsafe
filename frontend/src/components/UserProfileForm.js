import React, { useState } from "react";
import { User } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

const SKIN_TYPES = [
  { value: "I", label: "Type I - Very Fair", description: "Always burns, never tans" },
  { value: "II", label: "Type II - Fair", description: "Usually burns, tans minimally" },
  { value: "III", label: "Type III - Medium", description: "Sometimes burns, tans uniformly" },
  { value: "IV", label: "Type IV - Olive", description: "Burns minimally, tans easily" },
  { value: "V", label: "Type V - Brown", description: "Rarely burns, tans darkly" },
  { value: "VI", label: "Type VI - Dark Brown", description: "Never burns, deeply pigmented" },
];

const ACTIVITIES = [
  { value: "Indoor", label: "Indoor", description: "Mostly indoors" },
  { value: "Walking", label: "Walking", description: "Light outdoor walk" },
  { value: "Sports", label: "Sports", description: "Outdoor sports" },
  { value: "Hiking", label: "Hiking", description: "Extended hiking" },
  { value: "Beach", label: "Beach", description: "Beach activities" },
  { value: "Swimming", label: "Swimming", description: "Swimming/water sports" },
];

const SWEATING_LEVELS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export const UserProfileForm = ({ onSubmit, loading }) => {
  const [profile, setProfile] = useState({
    skin_type: "III",
    activity: "Walking",
    sweating: "Medium",
    age: 30,
    gender: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="neumorphic-card rounded-2xl p-6 space-y-6" data-testid="user-profile-form">
      <div>
        <h3 className="text-xl font-medium tracking-tight text-slate-800 mb-1 flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Your Profile</span>
        </h3>
        <p className="text-sm text-slate-600">Help us personalize your sun protection</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600 mb-2 block">
            Skin Type
          </Label>
          <Select value={profile.skin_type} onValueChange={(value) => setProfile((p) => ({ ...p, skin_type: value }))}>
            <SelectTrigger data-testid="skin-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKIN_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600 mb-2 block">
            Outdoor Activity
          </Label>
          <Select value={profile.activity} onValueChange={(value) => setProfile((p) => ({ ...p, activity: value }))}>
            <SelectTrigger data-testid="activity-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITIES.map((activity) => (
                <SelectItem key={activity.value} value={activity.value}>
                  <div>
                    <p className="font-medium">{activity.label}</p>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600 mb-2 block">
            Sweating Level
          </Label>
          <Select value={profile.sweating} onValueChange={(value) => setProfile((p) => ({ ...p, sweating: value }))}>
            <SelectTrigger data-testid="sweating-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SWEATING_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age" className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600 mb-2 block">
              Age (Optional)
            </Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="120"
              value={profile.age}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                setProfile((p) => ({ ...p, age: Number.isNaN(parsed) ? "" : Math.min(120, Math.max(1, parsed)) }));
              }}
              data-testid="age-input"
            />
          </div>

          <div>
            <Label htmlFor="gender" className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600 mb-2 block">
              Gender (Optional)
            </Label>
            <Input
              id="gender"
              type="text"
              value={profile.gender}
              onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
              placeholder="Optional"
              data-testid="gender-input"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-6 text-lg font-medium transition-transform hover:-translate-y-0.5"
        disabled={loading}
        data-testid="get-recommendation-submit"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Analyzing...
          </span>
        ) : (
          "Get AI Recommendation"
        )}
      </Button>
    </form>
  );
};
