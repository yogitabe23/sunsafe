import React, { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Search, Calendar, MapPin, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { api, getErrorMessage } from "@/lib/api";

const RISK_COLORS = {
  Low: "bg-green-100 text-green-800",
  Moderate: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
  Extreme: "bg-red-200 text-red-900",
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/history");
      setHistory(response.data);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load history");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return history.filter((item) => {
      const matchesSearch =
        !term ||
        item.skin_type.toLowerCase().includes(term) ||
        item.activity.toLowerCase().includes(term) ||
        item.risk.toLowerCase().includes(term);
      const matchesRisk = filterRisk === "all" || item.risk === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [history, searchTerm, filterRisk]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="history-loading">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="history-error">
        <div className="neumorphic-card rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Failed to Load History</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={fetchHistory} className="bg-blue-600 hover:bg-blue-700">Retry</Button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="history-empty">
        <div className="neumorphic-card rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No History Yet</h2>
          <p className="text-slate-600">Your prediction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="history-page">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-800 mb-2">Prediction History</h1>
        <p className="text-slate-600">View and analyze your past recommendations</p>
      </div>

      <div className="neumorphic-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by skin type, activity, or risk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700"
            data-testid="risk-filter"
          >
            <option value="all">All Risks</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Extreme">Extreme</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p data-testid="result-count">
            Showing <span className="font-semibold">{filteredHistory.length}</span> of{" "}
            <span className="font-semibold">{history.length}</span> predictions
          </p>
        </div>
      </div>

      <div className="neumorphic-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>UV Index</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Skin Type</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>SPF</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors" data-testid="history-row">
                  <TableCell className="font-medium">{formatDate(item.timestamp)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-semibold text-amber-600">{item.uv_index}</span></TableCell>
                  <TableCell>{item.temperature}°C</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium">Type {item.skin_type}</span>
                  </TableCell>
                  <TableCell>{item.activity}</TableCell>
                  <TableCell><span className="font-bold text-blue-600">SPF {item.spf}</span></TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${RISK_COLORS[item.risk] || "bg-slate-100 text-slate-700"}`}>
                      {item.risk}
                    </span>
                  </TableCell>
                  <TableCell>{item.confidence}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
