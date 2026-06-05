"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Search, Loader2, Calendar, User, Info, AlertTriangle, Tag } from "lucide-react";

export default function StudentAnnouncementsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, URGENT, NOTICE

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sort announcements by date (newest first)
          const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPosts(sorted);
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "ALL") return matchesSearch;
    return matchesSearch && post.type === filterType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Announcements</h1>
          <p className="text-muted-foreground text-sm">Official updates, guidelines, and urgent notifications from the hostel administration.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#16161a] border border-white/5 focus:border-primary/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground w-full sm:w-[220px] transition-all outline-none"
            />
          </div>

          <div className="flex bg-[#16161a] border border-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "ALL" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("URGENT")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "URGENT" 
                  ? "bg-red-500 text-white shadow-md shadow-red-500/10" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Urgent
            </button>
            <button
              onClick={() => setFilterType("NOTICE")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "NOTICE" 
                  ? "bg-[#27272a] text-white shadow-md" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Notices
            </button>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-3xl border bg-[#121214] shadow-xl flex flex-col justify-between relative ${
                post.type === "URGENT" ? "border-red-500/20 bg-red-500/[0.015]" : "border-white/5"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                    post.type === "URGENT" 
                      ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {post.type === "URGENT" ? <AlertTriangle size={10} /> : <Tag size={10} />}
                    {post.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {post.media && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20 aspect-video max-h-48">
                  {post.media.endsWith('.mp4') || post.media.endsWith('.webm') ? (
                    <video src={post.media} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.media} alt={post.title} className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
                <span className="flex items-center gap-1.5 font-medium">
                  <User size={12} />
                  Posted by Admin
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <p className="text-muted-foreground font-medium">No announcements found matching your filter.</p>
        </div>
      )}
    </div>
  );
}
