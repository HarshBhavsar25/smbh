"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Loader2, AlertTriangle, Trash2 
} from "lucide-react";

export default function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals / Form State
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setComplaints(data);
      }
    } catch (err) {
      console.error("Error fetching complaints", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create complaint");
      }

      setShowNew(false);
      setTitle("");
      setDescription("");
      fetchComplaints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchComplaints();
      } else {
        alert("Failed to delete complaint");
      }
    } catch (err) {
      console.error("Error deleting complaint", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Complaints</h1>
          <p className="text-muted-foreground">Voice your concerns, suggest improvements, and track resolution progress.</p>
        </div>
        <button 
          onClick={() => setShowNew(!showNew)}
          className="px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Complaint
        </button>
      </div>

      {showNew && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl"
        >
          <h3 className="text-lg font-bold text-white mb-4">File a New Complaint</h3>
          
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <input 
              type="text" 
              required
              placeholder="Brief Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none" 
            />
            <textarea 
              rows={4} 
              required
              placeholder="Detailed description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none" 
            />
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowNew(false)} 
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Submit Complaint"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : complaints.length > 0 ? (
        <div className="space-y-4">
          {complaints.map((comp, i) => {
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={comp.id} 
                className="p-6 rounded-3xl border border-white/5 bg-[#121214] flex flex-col gap-4 shadow-xl"
              >
                <div className="flex gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${
                          comp.status === 'OPEN' ? 'border-destructive/50 text-destructive bg-destructive/10' : 
                          comp.status === 'IN_PROGRESS' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                          'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                        }`}>
                          {comp.status}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comp.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteComplaint(comp.id)}
                        className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-white/5 transition-all"
                        title="Delete Complaint"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{comp.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {comp.description}
                      </p>
                    </div>

                    {comp.adminResponse && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        <p className="text-sm text-white/90">
                          <span className="font-semibold text-white">Admin Response:</span> {comp.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Complaints Filed</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">If you have any issues or suggestions, feel free to submit a complaint.</p>
        </div>
      )}
    </div>
  );
}
