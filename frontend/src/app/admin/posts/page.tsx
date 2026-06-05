"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trash2, ArrowRight, BellRing, Search, Plus, Loader2, X, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "NOTICE", // NOTICE, URGENT, EVENT
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/posts`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sort by creation date descending
          const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPosts(sorted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create announcement");
      }

      setIsModalOpen(false);
      setFormData({ title: "", content: "", type: "NOTICE" });
      fetchPosts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/posts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Announcements</h1>
          <p className="text-muted-foreground text-sm">Create and view official notices, warnings, and event announcements for all residents.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#16161a] border border-white/5 focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground w-[250px] transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => {
              setError("");
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus size={16} /> Create Announcement
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div 
              key={post.id} 
              className={`p-6 rounded-3xl border bg-[#121214] shadow-xl flex flex-col justify-between relative group ${
                post.type === "URGENT" ? "border-red-500/20 bg-red-500/[0.02]" : "border-white/5"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    post.type === "URGENT" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    post.type === "EVENT" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}>
                    {post.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short"
                      })}
                    </span>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-snug">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap">{post.content}</p>
              </div>

              <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground font-semibold uppercase">
                  W
                </div>
                <span className="text-xs text-muted-foreground font-medium">Posted by Warden</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Announcements Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Create your first hostel announcement to notify the students.</p>
        </div>
      )}

      {/* Create Announcement Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Create Announcement</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    placeholder="e.g. Mess Closed on Sunday"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                  >
                    <option value="NOTICE">Standard Notice</option>
                    <option value="URGENT">Urgent Warning</option>
                    <option value="EVENT">Event Invitation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Content</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                    placeholder="Write announcement details here..."
                  />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Publish Notice"}
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
