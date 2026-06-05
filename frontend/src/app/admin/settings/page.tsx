"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Lock, LogOut, Check, Loader2, AlertTriangle, ShieldCheck, Upload 
} from "lucide-react";

export default function SettingsAdminPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.profileImage) {
          setProfileImage(data.profileImage);
        }
      })
      .catch(console.error);
    }
  }, []);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const token = localStorage.getItem("token");
    
    try {
      // 1. Upload file
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/upload-profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("Upload failed");

      // 2. Update user profile
      const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/me/profile-image`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ imageUrl: uploadData.url })
      });
      if (!updateRes.ok) throw new Error("Failed to update profile");

      setProfileImage(uploadData.url);
      setSuccess("Profile image updated! Refresh to see changes globally.");
      // Optional: Update localStorage or global state if implemented
    } catch (err: any) {
      setError(err.message || "Something went wrong uploading profile image");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to change password. Make sure current password is correct.");
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your credentials, preferences, and system access.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left column info */}
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] flex flex-col items-center text-center">
            
            <div className="relative group w-24 h-24 rounded-full border border-primary/20 overflow-hidden mb-4 bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profileImage || "/admin-avatar.jpg"} alt="Profile" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-medium">
                <Upload size={16} className="mb-1" />
                Upload
                <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
              </label>
            </div>
            {isUploading && <span className="text-[10px] text-primary animate-pulse mb-2">Uploading...</span>}

            <h3 className="font-bold text-white mb-1">Administrator Profile</h3>
            <p className="text-xs text-muted-foreground mb-6">shreemauliboyshostel@gmail.com</p>
            
            <button 
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-destructive hover:bg-destructive/90 transition-colors text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Right column forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Lock size={20} className="text-primary" /> Update Password
            </h3>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
                <Check size={16} /> {success}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                <input 
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Enter current password"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">New Password</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
