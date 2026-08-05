import React, { useEffect, useState, useCallback } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { toast } from "sonner";
import { TrendingUp, Download, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { api, getErrorMessage } from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#334155", "#0EA5E9", "#EC4899"];
// Cycle the palette instead of indexing a fixed-length array, so distributions
// with more categories than colors don't render `undefined` (invisible slices).
const colorsFor = (n) => Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]);

export const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/analytics");
      setAnalytics(response.data);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load analytics");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "sunsafe_predictions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to export CSV"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="analytics-loading">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="analytics-error">
        <div className="neumorphic-card rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Failed to Load Analytics</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={fetchAnalytics} className="bg-blue-600 hover:bg-blue-700">Retry</Button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.total_predictions === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="analytics-empty">
        <div className="neumorphic-card rounded-2xl p-12 text-center">
          <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Data Yet</h2>
          <p className="text-slate-600">Get your first sunscreen recommendation to see analytics</p>
        </div>
      </div>
    );
  }

  const dailyUVData = {
    labels: analytics.daily_uv.map((d) => new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    datasets: [{
      label: "UV Index",
      data: analytics.daily_uv.map((d) => d.uv),
      borderColor: PALETTE[2],
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      fill: true,
      tension: 0.4,
    }],
  };

  const weeklyUVData = {
    labels: analytics.weekly_uv.map((w) => w.week),
    datasets: [{ label: "Average UV Index", data: analytics.weekly_uv.map((w) => w.uv), backgroundColor: PALETTE[0], borderRadius: 8 }],
  };

  const spfKeys = Object.keys(analytics.spf_distribution);
  const spfDistData = {
    labels: spfKeys.map((k) => `SPF ${k}`),
    datasets: [{ data: Object.values(analytics.spf_distribution), backgroundColor: colorsFor(spfKeys.length), borderWidth: 0 }],
  };

  const skinKeys = Object.keys(analytics.skin_type_distribution);
  const skinTypeDistData = {
    labels: skinKeys.map((k) => `Type ${k}`),
    datasets: [{ data: Object.values(analytics.skin_type_distribution), backgroundColor: colorsFor(skinKeys.length), borderWidth: 0 }],
  };

  const riskKeys = Object.keys(analytics.risk_distribution);
  const riskDistData = {
    labels: riskKeys,
    datasets: [{ data: Object.values(analytics.risk_distribution), backgroundColor: colorsFor(riskKeys.length), borderWidth: 0 }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
  };

  const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="analytics-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-800 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Insights from your sun protection history</p>
        </div>
        <Button onClick={handleExportCSV} className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700" data-testid="export-csv-btn">
          <Download className="w-4 h-4 mr-2" />
          Export for Power BI
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="neumorphic-card rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-2">Total Predictions</p>
          <p className="text-4xl font-bold text-slate-800" data-testid="total-predictions">{analytics.total_predictions}</p>
        </div>
        <div className="neumorphic-card rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-2">Avg Confidence</p>
          <p className="text-4xl font-bold text-slate-800" data-testid="avg-confidence">{analytics.avg_confidence}%</p>
        </div>
        <div className="neumorphic-card rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-2">Data Points</p>
          <p className="text-4xl font-bold text-slate-800">{analytics.daily_uv.length} days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neumorphic-card rounded-2xl p-6">
          <h3 className="text-xl font-medium text-slate-800 mb-4">Daily UV Trend</h3>
          <div className="chart-container"><Line data={dailyUVData} options={chartOptions} /></div>
        </div>
        <div className="neumorphic-card rounded-2xl p-6">
          <h3 className="text-xl font-medium text-slate-800 mb-4">Weekly UV Average</h3>
          <div className="chart-container"><Bar data={weeklyUVData} options={chartOptions} /></div>
        </div>
        <div className="neumorphic-card rounded-2xl p-6">
          <h3 className="text-xl font-medium text-slate-800 mb-4">SPF Recommendations</h3>
          <div className="chart-container"><Doughnut data={spfDistData} options={doughnutOptions} /></div>
        </div>
        <div className="neumorphic-card rounded-2xl p-6">
          <h3 className="text-xl font-medium text-slate-800 mb-4">Risk Level Distribution</h3>
          <div className="chart-container"><Doughnut data={riskDistData} options={doughnutOptions} /></div>
        </div>
        <div className="neumorphic-card rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-xl font-medium text-slate-800 mb-4">Skin Type Distribution</h3>
          <div className="chart-container"><Bar data={skinTypeDistData} options={chartOptions} /></div>
        </div>
      </div>
    </div>
  );
};
