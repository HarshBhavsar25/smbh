"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, AlertTriangle, CheckCircle2, Clock, Loader2, Eye, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentLeavePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    if (!token || !studentId) {
      setError("Session not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/leave-requests/student/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch leave requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");

    if (!file) {
      setError("Please select a signed leave form or notice image to upload.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Upload form image
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/leave-requests/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload leave form image");
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 2. Create Leave Request record
      const requestRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/leave-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, imageUrl })
      });

      if (!requestRes.ok) {
        throw new Error("Failed to register leave request");
      }

      setSuccess("Your permanent leave notice has been submitted successfully. Admin will review the form.");
      setFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Leave Hostel Permanently</h1>
        <p className="text-muted-foreground">Submit a permanent checkout notice. Please print, sign, and upload a photo/scan of your physical leave application form.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Submission Form */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] h-fit">
            <h3 className="text-lg font-bold text-white mb-6">Submit Leave Form</h3>
            
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Upload Signed Application Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#16161a]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {filePreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white font-semibold">Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground font-semibold text-center">Click to browse or drop file</p>
                      <p className="text-xs text-white/20 mt-1">PNG, JPG, JPEG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-destructive text-white font-bold rounded-xl hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Submit Leave Notice"
                )}
              </button>
            </form>
          </div>

          {/* Submission History */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] h-fit">
            <h3 className="text-lg font-bold text-white mb-6">Leave Requests History</h3>

            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div 
                    key={req.id} 
                    className="p-4 bg-[#16161a] border border-white/5 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        req.status === "REJECTED" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {req.status === "APPROVED" ? <CheckCircle2 size={12} /> :
                         req.status === "REJECTED" ? <AlertTriangle size={12} /> :
                         <Clock size={12} />}
                        {req.status}
                      </span>
                    </div>
                    
                    <a 
                      href={req.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Eye size={12} /> View Notice
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                <Clock className="w-10 h-10 text-white/5 mx-auto mb-2" />
                <p>No checkout notifications submitted yet.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
