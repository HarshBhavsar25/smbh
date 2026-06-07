"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Calendar, Send, Loader2, CheckCircle2, Clock, Home, AlertTriangle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ON_VACATION: { label: "On Vacation", color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: <Plane size={12} /> },
  RETURNED: { label: "Returned", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 size={12} /> },
  IN_HOSTEL: { label: "In Hostel", color: "text-sky-500 bg-sky-500/10 border-sky-500/20", icon: <Home size={12} /> },
};

export default function VacationPage() {
  const [reason, setReason] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/vacations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching vacation requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");

    try {
      const res = await fetch(`${API}/vacations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          reason,
          departureDate: new Date(departure).toISOString(),
          returnDate: returnDate ? new Date(returnDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit vacation request");
      }

      setSuccess("Vacation request submitted! The admin has been notified.");
      setReason("");
      setDeparture("");
      setReturnDate("");
      fetchMyRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Vacation Request</h1>
        <p className="text-muted-foreground">Submit a request to go home. The warden will be notified automatically.</p>
      </div>

      {/* FORM */}
      <div className="p-8 rounded-3xl border border-white/5 bg-[#121214] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex gap-2 items-center">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex gap-2 items-center">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Calendar size={14} /> Departure Date
              </label>
              <input
                type="date"
                required
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Calendar size={14} /> Expected Return Date <span className="text-muted-foreground">(Optional)</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Reason for Vacation</label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Diwali holidays, Medical checkup, Family function..."
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {isSubmitting ? "Submitting..." : "Submit Vacation Request"}
          </button>
        </form>
      </div>

      {/* REQUEST HISTORY */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">My Requests</h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center p-12 rounded-3xl border border-white/5 bg-[#121214]">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No vacation requests submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG["IN_HOSTEL"];
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-5 rounded-2xl border border-white/5 bg-[#121214] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{req.reason}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Plane size={12} /> Departure: {new Date(req.departureDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {req.returnDate && (
                        <span className="flex items-center gap-1">
                          <Home size={12} /> Return: {new Date(req.returnDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Submitted: {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 w-max shrink-0 ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
