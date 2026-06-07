"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plane, Home, CheckCircle2, Clock, Search, Loader2, User, CalendarDays, RefreshCcw
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_OPTIONS = [
  { value: "ON_VACATION", label: "On Vacation", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "RETURNED", label: "Returned", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "IN_HOSTEL", label: "In Hostel", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
];

export default function AdminVacationsPage() {
  const [vacations, setVacations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchVacations();
  }, []);

  const fetchVacations = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/vacations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVacations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching vacations", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/vacations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setVacations((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status } : v))
        );
      }
    } catch (err) {
      console.error("Error updating status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = vacations.filter((v) => {
    const matchSearch =
      v.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.student?.room?.roomNumber?.includes(searchQuery);
    const matchStatus = filterStatus === "ALL" || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Analytics
  const onVacation = vacations.filter((v) => v.status === "ON_VACATION").length;
  const returned = vacations.filter((v) => v.status === "RETURNED").length;
  const inHostel = vacations.filter((v) => v.status === "IN_HOSTEL").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vacation Tracker</h1>
          <p className="text-muted-foreground">Monitor and manage resident vacation requests in real-time.</p>
        </div>
        <button
          onClick={fetchVacations}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "On Vacation", count: onVacation, icon: <Plane size={20} />, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
          { label: "Returned", count: returned, icon: <CheckCircle2 size={20} />, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
          { label: "In Hostel", count: inHostel, icon: <Home size={20} />, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
        ].map((stat) => (
          <div key={stat.label} className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl flex items-center gap-5">
            <span className={`p-3 rounded-2xl border ${stat.color}`}>{stat.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#121214] border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3 text-muted-foreground" size={17} />
          <input
            type="text"
            placeholder="Search by name or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["ALL", "ON_VACATION", "RETURNED", "IN_HOSTEL"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                filterStatus === s
                  ? "bg-white/10 text-white border-white/10"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {s === "ALL" ? "All" : s === "ON_VACATION" ? "On Vacation" : s === "RETURNED" ? "Returned" : "In Hostel"}
            </button>
          ))}
        </div>
      </div>

      {/* Vacation Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-16 rounded-3xl border border-white/5 bg-[#121214]">
          <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No vacation records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((v, i) => {
            const statusCfg = STATUS_OPTIONS.find((s) => s.value === v.status) || STATUS_OPTIONS[0];
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Student Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {v.student?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "ST"}
                  </div>
                  <div>
                    <p className="font-bold text-white">{v.student?.fullName || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {v.student?.room ? `Room ${v.student.room.roomNumber}` : "Unassigned"} &bull; {v.student?.mobile || ""}
                    </p>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Plane size={13} className="text-amber-500" />
                    <span>Departure: <strong className="text-white">{new Date(v.departureDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong></span>
                  </span>
                  {v.returnDate && (
                    <span className="flex items-center gap-1.5">
                      <Home size={13} className="text-emerald-500" />
                      <span>Return: <strong className="text-white">{new Date(v.returnDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong></span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    <span>Submitted: {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </span>
                </div>

                {/* Reason */}
                <p className="text-sm text-muted-foreground max-w-xs italic">"{v.reason}"</p>

                {/* Status Dropdown */}
                <div className="shrink-0">
                  {updatingId === v.id ? (
                    <Loader2 className="animate-spin text-primary" size={20} />
                  ) : (
                    <select
                      value={v.status}
                      onChange={(e) => handleStatusUpdate(v.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border cursor-pointer bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/50 ${statusCfg.color}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#121214] text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
