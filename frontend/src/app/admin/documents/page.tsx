"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, Eye, Trash2, FileText, CheckCircle2, XCircle, Loader2, Download 
} from "lucide-react";

export default function AdminDocumentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, MISSING_AADHAAR, MISSING_PAN, FULLY_DOCUMENTED, NONE_UPLOADED

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error("Error fetching students for documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (studentId: string, docType: "Aadhaar" | "PAN") => {
    if (!confirm(`Are you sure you want to delete this student's ${docType} document?`)) return;
    
    const token = localStorage.getItem("token");
    const updateField = docType === "Aadhaar" ? "aadhaarUrl" : "panUrl";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ [updateField]: null })
      });

      if (res.ok) {
        // Refresh student list
        fetchStudents();
      } else {
        alert("Failed to delete document");
      }
    } catch (err) {
      console.error("Error deleting document", err);
    }
  };

  // Compute analytics
  const totalStudents = students.length;
  const aadhaarUploadedCount = students.filter(s => !!s.aadhaarUrl).length;
  const panUploadedCount = students.filter(s => !!s.panUrl).length;
  
  const filteredStudents = students.filter(student => {
    // Search match
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (student.room?.roomNumber || "").includes(searchQuery);
    
    if (!matchesSearch) return false;

    // Filter match
    switch (filterType) {
      case "MISSING_AADHAAR":
        return !student.aadhaarUrl;
      case "MISSING_PAN":
        return !student.panUrl;
      case "FULLY_DOCUMENTED":
        return !!student.aadhaarUrl && !!student.panUrl;
      case "NONE_UPLOADED":
        return !student.aadhaarUrl && !student.panUrl;
      case "ALL":
      default:
        return true;
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Documents Dashboard</h1>
          <p className="text-muted-foreground">Monitor, verify, and manage resident KYC documents (Aadhaar & PAN).</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Aadhaar Coverage</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{aadhaarUploadedCount}</span>
            <span className="text-sm text-muted-foreground">/ {totalStudents} residents</span>
          </div>
          <div className="h-1.5 w-full bg-[#16161a] rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${totalStudents > 0 ? (aadhaarUploadedCount / totalStudents) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">PAN Coverage</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{panUploadedCount}</span>
            <span className="text-sm text-muted-foreground">/ {totalStudents} residents</span>
          </div>
          <div className="h-1.5 w-full bg-[#16161a] rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${totalStudents > 0 ? (panUploadedCount / totalStudents) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Fully Documented</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-500">
              {students.filter(s => !!s.aadhaarUrl && !!s.panUrl).length}
            </span>
            <span className="text-sm text-muted-foreground">/ {totalStudents} residents</span>
          </div>
          <div className="h-1.5 w-full bg-[#16161a] rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${totalStudents > 0 ? (students.filter(s => !!s.aadhaarUrl && !!s.panUrl).length / totalStudents) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#121214] border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by name or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { label: "All Residents", val: "ALL" },
            { label: "Missing Aadhaar", val: "MISSING_AADHAAR" },
            { label: "Missing PAN", val: "MISSING_PAN" },
            { label: "Fully Documented", val: "FULLY_DOCUMENTED" },
            { label: "No Documents", val: "NONE_UPLOADED" }
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setFilterType(item.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                filterType === item.val
                  ? "bg-white/10 text-white border-white/10"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* DOCUMENTS LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="bg-[#121214] border border-white/5 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-[#16161a]/50">
                  <th className="py-4 px-6">Resident</th>
                  <th className="py-4 px-6">Room</th>
                  <th className="py-4 px-6">Aadhaar Card</th>
                  <th className="py-4 px-6">PAN Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/95">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={student.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-white">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{student.course}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        {student.room ? `Room ${student.room.roomNumber}` : <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      
                      {/* Aadhaar Column */}
                      <td className="py-4 px-6">
                        {student.aadhaarUrl ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                              <CheckCircle2 size={12} /> Uploaded
                            </span>
                            <div className="flex gap-1">
                              <a
                                href={student.aadhaarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                                title="Open / Download Aadhaar"
                              >
                                <Download size={14} />
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(student.id, "Aadhaar")}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                title="Delete Aadhaar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-red-500 flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg w-max">
                            <XCircle size={12} /> Missing
                          </span>
                        )}
                      </td>

                      {/* PAN Column */}
                      <td className="py-4 px-6">
                        {student.panUrl ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                              <CheckCircle2 size={12} /> Uploaded
                            </span>
                            <div className="flex gap-1">
                              <a
                                href={student.panUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
                                title="Open / Download PAN"
                              >
                                <Download size={14} />
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(student.id, "PAN")}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                title="Delete PAN"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-red-500 flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg w-max">
                            <XCircle size={12} /> Missing
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
