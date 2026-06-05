"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, MessageSquare, ChevronUp, ChevronDown, CheckCircle2, 
  Loader2, Send, CornerDownRight, AlertTriangle 
} from "lucide-react";

export default function StudentCommunityPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals / Form State
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Collapsed comments state
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Get student ID from storage
    if (typeof window !== "undefined") {
      setStudentId(localStorage.getItem("studentId"));
    }
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

  const handleVote = async (complaintId: string, type: boolean) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints/${complaintId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        fetchComplaints(); // Refresh list to get new counts
      }
    } catch (err) {
      console.error("Error voting", err);
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

  const handleSubmitComment = async (complaintId: string) => {
    const text = commentText[complaintId];
    if (!text || !text.trim()) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints/${complaintId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        setCommentText({ ...commentText, [complaintId]: "" });
        fetchComplaints();
      }
    } catch (err) {
      console.error("Comment submit error", err);
    }
  };

  const toggleComments = (complaintId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [complaintId]: !prev[complaintId]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Feed</h1>
          <p className="text-muted-foreground">Voice your concerns, suggest improvements, and vote on important issues.</p>
        </div>
        <button 
          onClick={() => setShowNew(!showNew)}
          className="px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Post
        </button>
      </div>

      {showNew && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl"
        >
          <h3 className="text-lg font-bold text-white mb-4">Create New Complaint or Suggestion</h3>
          
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
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Submit Post"}
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
            const votesList = comp.votes || [];
            const agrees = votesList.filter((v: any) => v.type === true).length;
            const disagrees = votesList.filter((v: any) => v.type === false).length;
            
            const hasAgreed = votesList.some((v: any) => v.studentId === studentId && v.type === true);
            const hasDisagreed = votesList.some((v: any) => v.studentId === studentId && v.type === false);

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={comp.id} 
                className="p-6 rounded-3xl border border-white/5 bg-[#121214] flex flex-col gap-4 shadow-xl"
              >
                <div className="flex gap-6">
                  {/* Content Column */}
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
                          Posted by {comp.student?.fullName || "Resident"}
                        </span>
                      </div>
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

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
                      {/* Agree / Disagree Voting Capsule */}
                      <div className="flex items-center gap-2 bg-[#16161a] border border-white/5 rounded-full p-1">
                        <button 
                          onClick={() => handleVote(comp.id, true)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold ${
                            hasAgreed ? 'bg-emerald-500/20 text-emerald-500' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <ChevronUp size={16} />
                          <span>{agrees} Agree</span>
                        </button>
                        <div className="w-px h-4 bg-white/10" />
                        <button 
                          onClick={() => handleVote(comp.id, false)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold ${
                            hasDisagreed ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <ChevronDown size={16} />
                          <span>{disagrees} Disagree</span>
                        </button>
                      </div>

                      {/* Comments toggle */}
                      <button 
                        onClick={() => toggleComments(comp.id)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm font-medium"
                      >
                        <MessageSquare size={16} /> 
                        {comp.comments ? comp.comments.length : 0} Comments
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Comments Section */}
                <AnimatePresence>
                  {expandedComments[comp.id] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-white/5 pt-4 space-y-4"
                    >
                      {/* Comments List */}
                      {comp.comments && comp.comments.length > 0 && (
                        <div className="space-y-3 pl-4 border-l border-white/5">
                          {comp.comments.map((comm: any) => (
                            <div key={comm.id} className="text-sm">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-white text-xs">
                                  {comm.student?.fullName || "Resident"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comm.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-0.5">{comm.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Field */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={commentText[comp.id] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [comp.id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(comp.id); }}
                          className="flex-1 bg-[#16161a] border border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <button 
                          onClick={() => handleSubmitComment(comp.id)}
                          className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Posts in Community Feed</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Be the first to voice an issue or suggest an improvement.</p>
        </div>
      )}
    </div>
  );
}
