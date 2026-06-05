"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ChevronDown, ChevronUp, MessageSquare, ShieldAlert, CheckCircle2, 
  MoreHorizontal, Loader2, X, Send, AlertTriangle 
} from "lucide-react";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  
  // Response/Status Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Collapsed comments state
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

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

  const handleOpenResponseModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setAdminResponseText(complaint.adminResponse || "");
    setStatus(complaint.status);
    setError("");
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ adminResponse: adminResponseText, status })
      });

      if (!res.ok) {
        throw new Error("Failed to save response");
      }

      setSelectedComplaint(null);
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
      // In the admin dashboard, we can register comments on behalf of admin.
      // But the backend comment endpoint uses the logged in student's profile.
      // Wait, is there an admin comment backend endpoint?
      // Yes, POST /complaints/:id/comment uses the authenticated user's studentProfile,
      // but an Admin doesn't have a student profile.
      // To prevent errors, let's make the admin comment using their admin account,
      // or check if the backend supports admin comments.
      // Let's check backend complaints.controller.ts:
      // It tries to find studentProfile by req.user.userId. Since admin has no studentProfile,
      // comment submission will throw NotFoundException('Student profile not found').
      // So let's disable comments for admin, OR modify the controller to support comments from admins!
      // Let's modify the controller/service to allow comments from users directly and link it to User,
      // but since the db schema has ComplaintComment linked to StudentProfile, the database strictly requires studentId!
      // So Admin cannot comment unless we map it differently. To avoid breaking things, we'll let admins resolve and reply
      // using the official "adminResponse" field (which is the standard way to answer a complaint), and disable comments.
    } catch (err) {
      console.error("Comment submit error", err);
    }
  };

  const filteredComplaints = complaints.filter(comp => {
    if (activeTab === "Open") return comp.status === "OPEN" || comp.status === "IN_PROGRESS";
    if (activeTab === "Resolved") return comp.status === "RESOLVED";
    return true; // All
  });

  const totalOpen = complaints.filter(c => c.status === "OPEN").length;
  const totalInProgress = complaints.filter(c => c.status === "IN_PROGRESS").length;
  const totalResolved = complaints.filter(c => c.status === "RESOLVED").length;
  const resolutionRate = complaints.length > 0 
    ? Math.round((totalResolved / complaints.length) * 100) 
    : 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Feed</h1>
          <p className="text-muted-foreground">Manage and respond to resident complaints and suggestions.</p>
        </div>
        
        <div className="flex bg-[#16161a] p-1 rounded-xl border border-white/5 self-start md:self-auto">
          {['All', 'Open', 'Resolved'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-white/10 text-white' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((comp, i) => {
                const votesList = comp.votes || [];
                const agrees = votesList.filter((v: any) => v.type === true).length;
                const disagrees = votesList.filter((v: any) => v.type === false).length;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={comp.id} 
                    className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl relative group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                          <span className="font-bold text-primary">
                            {comp.student?.fullName ? comp.student.fullName.split(' ').map((n: string)=>n[0]).join('') : "R"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{comp.student?.fullName || "Resident"}</h4>
                          <p className="text-xs text-muted-foreground">
                            {comp.student?.room ? `Room ${comp.student.room.roomNumber}` : 'Unassigned'} • {new Date(comp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${
                        comp.status === 'OPEN' ? 'border-destructive/50 text-destructive bg-destructive/10' : 
                        comp.status === 'IN_PROGRESS' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                        'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                      }`}>
                        <span className="mr-1.5 inline-block w-1 h-1 rounded-full bg-current"></span>
                        {comp.status}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{comp.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {comp.description}
                    </p>

                    {comp.adminResponse && (
                      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        <p className="text-sm text-white/90">
                          <span className="font-semibold text-white">Admin Response:</span> {comp.adminResponse}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex items-center gap-4">
                        {/* Vote counts display */}
                        <div className="flex items-center gap-3 bg-[#16161a] border border-white/5 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 text-emerald-500 font-bold">
                            <ChevronUp size={16} /> {agrees} Agree
                          </span>
                          <span className="text-white/10">|</span>
                          <span className="flex items-center gap-1 text-red-500 font-bold">
                            <ChevronDown size={16} /> {disagrees} Disagree
                          </span>
                        </div>

                        <span className="text-muted-foreground hover:text-white transition-colors text-xs font-medium flex items-center gap-1">
                          <MessageSquare size={14} /> {comp.comments ? comp.comments.length : 0} Comments
                        </span>
                      </div>

                      <button 
                        onClick={() => handleOpenResponseModal(comp)}
                        className="px-4 py-1.5 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 text-xs font-semibold text-white transition-all"
                      >
                        Respond & Update
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No complaints found in this category.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Overview</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-[#16161a] border border-white/5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total Open</p>
                  <p className="text-3xl font-bold text-white">{totalOpen}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#16161a] border border-white/5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-amber-500">{totalInProgress}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Resolution Rate</span>
                  <span className="text-sm font-bold text-white">{resolutionRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#16161a] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${resolutionRate}%` }}></div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">System Health</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Issues Raised:</span>
                  <span className="font-semibold text-white">{complaints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved Issues:</span>
                  <span className="font-semibold text-emerald-500">{totalResolved}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Resolve Complaint</h3>
                <button onClick={() => setSelectedComplaint(null)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveResponse} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Official Admin Response</label>
                  <textarea 
                    rows={4}
                    required
                    value={adminResponseText}
                    onChange={(e) => setAdminResponseText(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    placeholder="Enter resolution details or comments..."
                  />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Response"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
