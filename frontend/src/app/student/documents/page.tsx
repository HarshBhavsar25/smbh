"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Upload, FileCheck, AlertCircle, Loader2, Eye, ShieldCheck 
} from "lucide-react";

export default function StudentDocumentsPage() {
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState("Aadhaar");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    if (!token || !studentId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
    } catch (err) {
      console.error("Error fetching student profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }
    
    setIsUploading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1. Upload to Cloudinary via profile upload endpoint
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/upload-profile`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("File upload failed");

      // 2. Map chosen document type to student profile field name
      const updateField = documentType === "Aadhaar" ? "aadhaarUrl" : "panUrl";

      // 3. Call standard student patch endpoint to save the URL
      const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${studentId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ [updateField]: uploadData.url })
      });

      if (!updateRes.ok) throw new Error("Failed to save document reference in profile.");

      setSuccess(`${documentType} uploaded successfully!`);
      setSelectedFile(null);
      
      // Refresh student profile to display updated URLs
      fetchStudentProfile();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const hasAadhaar = !!student?.aadhaarUrl;
  const hasPan = !!student?.panUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Documents Vault</h1>
        <p className="text-muted-foreground">Upload and manage official documents required for hostel onboarding.</p>
      </div>

      {/* Info Warning Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex gap-3 items-start">
        <AlertCircle size={20} className="shrink-0 text-amber-500 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Document Lock Notice</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            In compliance with administrative policies, uploaded documents are locked instantly and cannot be deleted or modified by residents. Please review files carefully before submitting.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* UPLOAD FORM */}
        <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Upload Document</h3>
          
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Select File (Image)</label>
              <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-[#16161a]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload size={32} className="text-muted-foreground" />
                  <p className="text-sm text-white font-medium">
                    {selectedFile ? selectedFile.name : "Click or drag image file here"}
                  </p>
                  <p className="text-xs text-muted-foreground">Supported format: PNG, JPG, JPEG</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </button>
          </form>
        </div>

        {/* CURRENT STATUS */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">Verification Registry</h3>
            
            <div className="space-y-4">
              {/* Aadhaar Row */}
              <div className="p-4 rounded-2xl bg-[#16161a] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`p-2.5 rounded-xl ${hasAadhaar ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-muted-foreground"}`}>
                    <FileCheck size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Aadhaar Card</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasAadhaar ? "Registered & Locked" : "Not uploaded yet"}
                    </p>
                  </div>
                </div>
                {hasAadhaar ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <ShieldCheck size={14} /> Active
                    </span>
                    <a
                      href={student.aadhaarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                      title="View Aadhaar"
                    >
                      <Eye size={16} />
                    </a>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-amber-500">Required</span>
                )}
              </div>

              {/* PAN Row */}
              <div className="p-4 rounded-2xl bg-[#16161a] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`p-2.5 rounded-xl ${hasPan ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-muted-foreground"}`}>
                    <FileCheck size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">PAN Card</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasPan ? "Registered & Locked" : "Not uploaded yet"}
                    </p>
                  </div>
                </div>
                {hasPan ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <ShieldCheck size={14} /> Active
                    </span>
                    <a
                      href={student.panUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                      title="View PAN"
                    >
                      <Eye size={16} />
                    </a>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-amber-500">Required</span>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
