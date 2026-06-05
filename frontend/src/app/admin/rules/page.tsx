"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShieldAlert, Loader2, Scale, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rules`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRules(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });

      if (!res.ok) {
        throw new Error("Failed to add rule");
      }

      setSuccess("Hostel rule published successfully!");
      setTitle("");
      setContent("");
      setShowAddModal(false);
      fetchRules();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rules/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setRules(rules.filter(r => r.id !== id));
      } else {
        alert("Failed to delete rule");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hostel Rules & Regulations</h1>
          <p className="text-muted-foreground">Manage official codes of conduct, safety policies, and guidelines for residents.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add New Rule
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={rule.id}
              className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl flex justify-between items-start gap-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                  <Scale size={20} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{rule.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{rule.content}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteRule(rule.id)}
                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <ShieldAlert className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Rules Active</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create guidelines for the hostel so students can view them on their dashboard.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-full"
          >
            Create First Rule
          </button>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#121214] border border-white/10 p-6 rounded-3xl shadow-2xl space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-white">Add New Rule</h3>
              <p className="text-xs text-muted-foreground">This guideline will be instantly visible to all residents.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddRule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Curfew Timings"
                  className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Rule Content / Guidelines</label>
                <textarea 
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the rules and policies in detail..."
                  className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Publish Rule"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
