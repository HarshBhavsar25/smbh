"use client";

import { useState, useEffect } from "react";
import { 
  Check, X, Eye, Clock, Calendar, AlertTriangle, UserMinus, 
  Loader2, CheckCircle2, Phone, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLeavesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/leave-requests`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${status} this leave request?`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/leave-requests/${id}/${status}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setRequests(requests.map(req => {
          if (req.id === id) {
            return { ...req, status: status === "approve" ? "APPROVED" : "REJECTED" };
          }
          return req;
        }));
      } else {
        alert(`Failed to ${status} leave notice.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === "ALL") return true;
    return req.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hostel Checkout Notices</h1>
          <p className="text-muted-foreground">Review and approve signed leave forms submitted by residents exiting the hostel permanently.</p>
        </div>
        
        {/* Filters */}
        <div className="flex bg-[#121214] border border-white/5 p-1 rounded-full text-xs font-semibold">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full transition-all ${
                filter === f ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={req.id}
              className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] flex flex-col justify-between hover:border-white/10 transition-all shadow-xl"
            >
              <div className="space-y-4">
                {/* User Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {req.student?.fullName ? req.student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "ST"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{req.student?.fullName || "Resident"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {req.student?.room ? `Room ${req.student.room.roomNumber}` : "Room Unassigned"}
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* Details */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>Submitted: {new Date(req.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    <span>Mobile: {req.student?.mobile || "N/A"}</span>
                  </div>
                </div>

                {/* Form Image Preview Capsule */}
                <div 
                  onClick={() => setPreviewImage(req.imageUrl)}
                  className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/5 bg-[#16161a] flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={req.imageUrl} 
                    alt="Notice" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1.5 bg-black/60 rounded-lg text-xs font-semibold text-white flex items-center gap-1">
                      <Eye size={12} /> Click to view
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                  req.status === "REJECTED" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                  "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  {req.status === "APPROVED" ? <CheckCircle2 size={10} /> :
                   req.status === "REJECTED" ? <AlertTriangle size={10} /> :
                   <Clock size={10} />}
                  {req.status}
                </span>

                {req.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(req.id, "reject")}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all"
                      title="Reject Request"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, "approve")}
                      className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-1"
                    >
                      <Check size={14} /> Approve Leave
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <ShieldAlert className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Leave Notices Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">There are currently no checkout forms in this status filter.</p>
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl aspect-[4/5] md:aspect-[3/4] max-h-[85vh] bg-[#121214] border border-white/10 rounded-3xl overflow-hidden p-2 flex flex-col"
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="flex-1 overflow-auto rounded-[20px] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewImage} 
                  alt="Full Notice" 
                  className="w-full h-auto object-contain mx-auto" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
