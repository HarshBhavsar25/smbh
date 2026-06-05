"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Trash2, Image as ImageIcon, Video, Loader2, 
  X, AlertTriangle, Plus, CheckCircle2, Eye 
} from "lucide-react";

export default function AdminGalleryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Lightbox / Preview modal state
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Custom Delete Confirmation State
  const [mediaToDelete, setMediaToDelete] = useState<any>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/gallery`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMedia(data);
      }
    } catch (err) {
      console.error("Error fetching gallery media", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", files[0]);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/gallery/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess("Media uploaded successfully!");
      fetchMedia();
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;
    const id = mediaToDelete.id;
    
    // Optimistic close
    setMediaToDelete(null);
    setSelectedMedia(null);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/gallery/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMedia();
      }
    } catch (err) {
      console.error("Delete media error", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gallery Management</h1>
          <p className="text-muted-foreground">Upload, view, and delete images and videos displayed on the hostel landing page.</p>
        </div>
        
        <label className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer">
          {isUploading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Upload size={18} />
          )}
          <span>Upload Media</span>
          <input 
            type="file" 
            accept="image/*,video/*"
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={isUploading}
          />
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl border border-white/5 bg-[#121214] overflow-hidden group relative flex flex-col justify-between"
            >
              {/* Media Preview Container */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setSelectedMedia(item)}>
                {item.type === "VIDEO" ? (
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt="Uploaded media" 
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(item);
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/10 transition-all transform scale-90 group-hover:scale-100 duration-200"
                    title="View Media"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaToDelete(item);
                    }}
                    className="p-3 bg-destructive/80 hover:bg-destructive rounded-full text-white transition-all transform scale-90 group-hover:scale-100 duration-200"
                    title="Delete Media"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Media Type Icon Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/10 z-20">
                  {item.type === "VIDEO" ? (
                    <>
                      <Video size={10} /> VIDEO
                    </>
                  ) : (
                    <>
                      <ImageIcon size={10} /> IMAGE
                    </>
                  )}
                </div>
              </div>

              {/* Info & Action Panel */}
              <div className="p-4 flex items-center justify-between border-t border-white/5 bg-[#141416]">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaToDelete(item);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">Gallery is Empty</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Upload photos or video walkthroughs of the hostel to showcase to visitors.</p>
          
          <label className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm inline-flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer">
            <Upload size={18} />
            <span>Upload First File</span>
            <input 
              type="file" 
              accept="image/*,video/*"
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[85vh] bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Close Button */}
              <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaToDelete(selectedMedia);
                  }}
                  className="p-2.5 rounded-full bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/30"
                  title="Delete media"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setSelectedMedia(null)}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-white/10 text-white transition-all border border-white/10"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Media Content */}
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative min-h-[300px]">
                {selectedMedia.type === "VIDEO" ? (
                  <video 
                    src={selectedMedia.url} 
                    controls 
                    autoPlay
                    className="w-full h-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <img 
                    src={selectedMedia.url} 
                    alt="Preview" 
                    className="w-full h-full max-h-[70vh] object-contain"
                  />
                )}
              </div>

              {/* Bottom Details Panel */}
              <div className="p-6 bg-[#16161a] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    {selectedMedia.type}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Uploaded on {new Date(selectedMedia.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaToDelete(selectedMedia);
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-500/90 text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    <Trash2 size={16} />
                    <span>Delete Media</span>
                  </button>
                  <button 
                    onClick={() => setSelectedMedia(null)}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {mediaToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#121214] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Delete Media</h3>
                <p className="text-sm text-muted-foreground">Are you sure you want to delete this media item? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setMediaToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-500/90 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
