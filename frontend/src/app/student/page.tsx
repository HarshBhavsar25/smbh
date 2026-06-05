"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  User, Mail, Phone, CheckCircle2, AlertTriangle, 
  ArrowRight, BookOpen, Clock, Plane, MessageSquare, Loader2, BellRing, Upload
} from "lucide-react";
import Image from "next/image";

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    if (!token || !studentId) {
      setIsLoading(false);
      return;
    }

    const headers = { "Authorization": `Bearer ${token}` };
    try {
      // Fetch student profile (includes room and roommates)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${studentId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }

      // Fetch fees to calculate paid/due
      const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees`, { headers });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (Array.isArray(payData)) {
          setPayments(payData.filter((p: any) => p.studentId === studentId));
        }
      }

      // Fetch notices/announcements
      const noticeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/posts`, { headers });
      if (noticeRes.ok) {
        const noticeData = await noticeRes.json();
        if (Array.isArray(noticeData)) {
          // Sort by creation date and get top 2 notices/urgent alerts
          const activeNotices = noticeData
            .filter((n: any) => n.type === "NOTICE" || n.type === "URGENT")
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);
          setNotices(activeNotices);
        }
      }
    } catch (err) {
      console.error("Error fetching student dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    
    try {
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/upload-profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("Upload failed");

      const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/students/${studentId}/profile-image`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ imageUrl: uploadData.url })
      });
      if (!updateRes.ok) throw new Error("Failed to update profile");

      setStudent({ ...student, photo: uploadData.url });
    } catch (err) {
      console.error("Error uploading profile image", err);
      alert("Failed to upload profile image");
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

  // Calculate fees dynamically
  const totalFee = 75000;
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalDue = Math.max(0, totalFee - totalPaid);

  const roommate = student?.room?.students?.find((s: any) => s.id !== student.id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Announcements / Notices Banner */}
      {notices.length > 0 && (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${
                notice.type === "URGENT" 
                  ? "bg-red-500/10 border-red-500/20 text-red-200" 
                  : "bg-primary/10 border-primary/20 text-primary-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-2xl shrink-0 ${
                  notice.type === "URGENT" ? "bg-red-500/20" : "bg-primary/20"
                }`}>
                  <BellRing size={18} className={notice.type === "URGENT" ? "text-red-400 animate-bounce" : "text-primary-400"} />
                </span>
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-85">{notice.type} Notice</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{notice.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{notice.content}</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                {new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* PROFILE CARD */}
        <div className="lg:col-span-2 p-1 rounded-3xl border border-white/5 bg-gradient-to-br from-primary/10 to-transparent shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <User size={200} />
          </div>
          <div className="h-full bg-[#121214]/90 backdrop-blur-xl rounded-[22px] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            <div className="relative group w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden shrink-0 bg-background">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={student?.photo || "/admin-avatar.jpg"} alt="Profile" className="object-cover w-full h-full" />
               <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs font-medium">
                 <Upload size={20} className="mb-1" />
                 Upload
                 <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
               </label>
               {isUploading && (
                 <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                   <Loader2 className="animate-spin text-primary" size={24} />
                 </div>
               )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-4">
                <CheckCircle2 size={14} /> Active Resident
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{student?.fullName || "Resident"}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-6">
                <BookOpen size={16} /> <span>{student?.course || "N/A"} {student?.year ? `(${student.year} Year)` : ""}</span>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-primary"><Phone size={16} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Mobile</p>
                    <p className="text-white font-medium">{student?.mobile || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-primary"><Mail size={16} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">College</p>
                    <p className="text-white font-medium break-words">{student?.collegeName || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROOM INFO */}
        <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Room Assignment</h3>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-black text-white">{student?.room ? student.room.roomNumber : "N/A"}</span>
              <span className="text-lg font-medium text-primary mb-1">
                {student?.room ? student.room.type.replace('_', ' ') : "Unassigned"}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Current Roommate</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                  {roommate ? roommate.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "NA"}
                </div>
                <p className="text-sm font-medium text-white">{roommate ? roommate.fullName : "No roommate assigned"}</p>
              </div>
            </div>
            <Link 
              href="/student/community"
              className="w-full block py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors text-center"
            >
              Request Room Transfer
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* FEE STATUS */}
        <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <h3 className="text-lg font-bold text-white">Fee Status</h3>
            <div className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              student?.feeStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
              "bg-red-500/10 text-red-500 border-red-500/20"
            }`}>
              <AlertTriangle size={14} /> {student?.feeStatus === "PAID" ? "PAID" : "NOT PAID"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
             <div>
               <p className="text-sm text-muted-foreground mb-1">Monthly Rent</p>
               <p className="text-xl font-bold text-white">₹5,300</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground mb-1">Status</p>
               <p className={`text-xl font-bold ${student?.feeStatus === "PAID" ? "text-emerald-500" : "text-red-500"}`}>
                 {student?.feeStatus === "PAID" ? "PAID" : "NOT PAID"}
               </p>
             </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock size={12}/> Outstanding Balance
              </p>
              <p className="text-2xl font-black text-white">₹{student?.feeStatus === "PAID" ? "0" : "5,300"}</p>
            </div>
            {student?.feeStatus !== "PAID" && (
              <Link 
                href="/student/fees"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Pay Now
              </Link>
            )}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="space-y-4">
           <Link href="/student/vacation" className="block p-6 rounded-3xl border border-white/5 bg-[#121214] hover:bg-[#16161a] transition-colors group">
             <div className="flex items-center justify-between mb-2">
               <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Plane size={24} />
               </div>
               <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-white/10 group-hover:text-white transition-all">
                 <ArrowRight size={16} className="group-hover:-rotate-45 transition-transform" />
               </div>
             </div>
             <h3 className="text-xl font-bold text-white mb-1 mt-4">Going Home?</h3>
             <p className="text-sm text-muted-foreground">Submit a vacation request and automatically notify the warden via WhatsApp.</p>
           </Link>

           <Link href="/student/community" className="block p-6 rounded-3xl border border-white/5 bg-[#121214] hover:bg-[#16161a] transition-colors group">
             <div className="flex items-center justify-between mb-2">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                 <MessageSquare size={24} />
               </div>
               <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-white/10 group-hover:text-white transition-all">
                 <ArrowRight size={16} className="group-hover:-rotate-45 transition-transform" />
               </div>
             </div>
             <h3 className="text-xl font-bold text-white mb-1 mt-4">Community Feed</h3>
             <p className="text-sm text-muted-foreground">Submit a complaint, vote on issues, or discuss hostel improvements.</p>
           </Link>
        </div>
      </div>

    </div>
  );
}
