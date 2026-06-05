"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Image as ImageIcon, Video, X } from "lucide-react";
import Link from "next/link";

export default function PublicGalleryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden px-6 py-12 md:py-20">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors group mb-2"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white">Full Gallery</h1>
            <p className="text-muted-foreground max-w-xl">Explore the campus, facilities, and student rooms at Shree Mauli Boys Hostel.</p>
          </div>
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-40">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-square rounded-2xl overflow-hidden glass-card group bg-black flex items-center justify-center border border-white/5 cursor-pointer"
                onClick={() => setSelectedMedia(item)}
              >
                {item.type === "VIDEO" ? (
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt="Gallery Media" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                )}
                
                {/* Micro badge indicator */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold flex items-center gap-1 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-20 glass-card rounded-3xl border border-white/5 bg-[#121214]">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Gallery Media Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Please check back later as the admin uploads images and video tours.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[85vh] bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-white/10 text-white transition-all border border-white/10"
              >
                <X size={18} />
              </button>

              {/* Main Content */}
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden min-h-[300px]">
                {selectedMedia.type === "VIDEO" ? (
                  <video 
                    src={selectedMedia.url} 
                    controls 
                    autoPlay
                    className="w-full h-full max-h-[75vh] object-contain"
                  />
                ) : (
                  <img 
                    src={selectedMedia.url} 
                    alt="Preview" 
                    className="w-full h-full max-h-[75vh] object-contain"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
