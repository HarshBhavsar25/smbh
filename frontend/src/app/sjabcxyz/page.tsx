"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, X, WifiOff, Loader2, Search, CheckCircle2, AlertTriangle, ShieldCheck 
} from "lucide-react";
import InstallAppButton from "@/components/InstallAppButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function StaffAttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<Record<string, "PRESENT" | "ABSENT">>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Swap manifest to attendance-specific one so "Install App" installs /sjabcxyz
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]');
    const prev = existing?.getAttribute("href") ?? "/manifest.json";
    if (existing) existing.setAttribute("href", "/manifest-attendance.json");
    return () => {
      if (existing) existing.setAttribute("href", prev);
    };
  }, []);
  
  // Offline and Error states
  const [isOfflineError, setIsOfflineError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Track if any attendance toggle has been modified
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Prevent accidental close/reload if changes are present
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isSuccess) {
        e.preventDefault();
        e.returnValue = "Attendance is not submitted yet. Refreshing or closing will clear all data. Are you sure?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, isSuccess]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/attendance/students-list`);
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      setStudents(data);

      // Initialize all students to PRESENT
      const initialAttendance: Record<string, "PRESENT" | "ABSENT"> = {};
      data.forEach((student: any) => {
        initialAttendance[student.id] = "PRESENT";
      });
      setAttendance(initialAttendance);

      // Translate names to Marathi asynchronously
      translateNames(data);
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not load resident list. Please check your internet connection.");
      setIsOfflineError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const translateNames = async (studentList: any[]) => {
    const newTranslations: Record<string, string> = {};
    
    // Process translations in batches or sequentially
    for (const student of studentList) {
      const name = student.fullName;
      try {
        const res = await fetch(
          `https://inputtools.google.com/request?text=${encodeURIComponent(name)}&itc=mr-t-i0-und&num=1`
        );
        if (res.ok) {
          const data = await res.json();
          if (data[0] === "SUCCESS" && data[1] && data[1].length > 0) {
            const marathiWords = data[1].map((item: any) => {
              if (item && item[1] && item[1].length > 0) {
                return item[1][0]; // First transliterated candidate
              }
              return item[0];
            });
            newTranslations[student.id] = marathiWords.join(" ");
          } else {
            newTranslations[student.id] = name;
          }
        } else {
          newTranslations[student.id] = name;
        }
      } catch (err) {
        newTranslations[student.id] = name; // Fallback to English name
      }
    }

    setTranslations((prev) => ({ ...prev, ...newTranslations }));
  };

  const handleToggle = (studentId: string, status: "PRESENT" | "ABSENT") => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    // 1. Internet Connection Check
    if (!navigator.onLine) {
      setErrorMessage("No internet connection detected. Attendance cannot be submitted.");
      setIsOfflineError(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const records = Object.keys(attendance).map((studentId) => ({
      studentId,
      status: attendance[studentId],
    }));

    try {
      const res = await fetch(`${API}/attendance/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          takenBy: "Staff Mobile Portal",
          records,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit attendance");

      // Success
      setIsSuccess(true);
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to submit attendance due to a network connection error.");
      setIsOfflineError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students based on search (name or room number)
  const filteredStudents = students.filter((student) => {
    const englishName = student.fullName.toLowerCase();
    const marathiName = (translations[student.id] || "").toLowerCase();
    const room = (student.room?.roomNumber || "").toLowerCase();
    const query = search.toLowerCase();
    return englishName.includes(query) || marathiName.includes(query) || room.includes(query);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-muted-foreground text-sm font-medium">Loading Student List & Translating...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6"
        >
          <Check size={32} />
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-2">उपस्थिती सादर केली!</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
          Attendance has been submitted successfully for today.
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            fetchStudents();
          }}
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all hover:bg-primary/90 cursor-pointer"
        >
          Take New Attendance
        </button>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(attendance).filter((s) => s === "ABSENT").length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/5 p-4 z-30 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-sm">
              M
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Mauli Attendance</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">माऊली उपस्थिती</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InstallAppButton appName="Mauli Attendance" className="!text-[10px] !px-2.5 !py-1" />
            <span className="text-[11px] text-muted-foreground font-semibold">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex gap-4 mt-3 py-1.5 px-3 bg-[#121214] rounded-xl border border-white/5 text-xs font-semibold">
          <div className="text-emerald-500 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Present: {presentCount}
          </div>
          <div className="text-red-500 flex items-center gap-1.5">
            <X size={13} className="border border-red-500/20 rounded-full" /> Absent: {absentCount}
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="नाव किंवा खोली क्रमांक शोधा (Search...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121214] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {/* Student List */}
      <main className="flex-1 p-4 overflow-y-auto space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No residents found matching "{search}"
          </div>
        ) : (
          filteredStudents.map((student) => {
            const status = attendance[student.id] || "PRESENT";
            const marathiName = translations[student.id] || student.fullName;
            const roomNo = student.room?.roomNumber || "N/A";

            return (
              <motion.div
                key={student.id}
                layout
                className="bg-[#121214] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="bg-[#1c1c21] border border-white/10 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {roomNo}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                      {student.fullName}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base tracking-wide mt-1">
                    {marathiName}
                  </h3>
                </div>

                {/* Present/Absent Toggle Switch */}
                <div className="flex bg-[#1c1c21] border border-white/5 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => handleToggle(student.id, "PRESENT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      status === "PRESENT"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    हजर
                  </button>
                  <button
                    onClick={() => handleToggle(student.id, "ABSENT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      status === "ABSENT"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    गैरहजर
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Floating Action Submit Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent z-30 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || students.length === 0}
          className="w-full py-4 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Submitting...
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> उपस्थिती सादर करा (Submit Attendance)
            </>
          )}
        </button>
      </footer>

      {/* Connection / Offline Error Modal */}
      <AnimatePresence>
        {isOfflineError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-white/10 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">नेटवर्क त्रुटी (Network Error)</h3>
              <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                {errorMessage}
              </p>
              <button
                onClick={() => setIsOfflineError(false)}
                className="w-full py-2.5 bg-[#1c1c21] hover:bg-white/5 text-white font-semibold text-xs rounded-xl border border-white/5 transition-colors cursor-pointer"
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
