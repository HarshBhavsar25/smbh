"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Search, FileText, Loader2, CheckCircle2, AlertTriangle, ArrowUpDown, ChevronRight 
} from "lucide-react";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"SINGLE" | "RANGE">("SINGLE");

  // Filter values
  const [singleDate, setSingleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, [filterMode, singleDate, fromDate, toDate]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    let url = `${API}/attendance/history`;
    const params = new URLSearchParams();

    if (filterMode === "SINGLE" && singleDate) {
      params.append("date", singleDate);
    } else if (filterMode === "RANGE") {
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Error fetching attendance history", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten sessions into individual student records for easier table rendering
  const flattenedRecords = sessions.flatMap((session) =>
    session.records.map((rec: any) => ({
      sessionId: session.id,
      date: session.date,
      takenBy: session.takenBy || "Staff",
      recordId: rec.id,
      studentId: rec.studentId,
      studentName: rec.student?.fullName || "Unknown",
      roomNumber: rec.student?.room?.roomNumber || "Unassigned",
      status: rec.status,
    }))
  );

  // Client-side search and sorting
  const filteredRecords = flattenedRecords
    .filter((rec) =>
      rec.studentName.toLowerCase().includes(search.toLowerCase()) ||
      rec.roomNumber.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by date desc, then room number asc, then name asc
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      
      const roomA = parseInt(a.roomNumber) || 999;
      const roomB = parseInt(b.roomNumber) || 999;
      if (roomA !== roomB) return roomA - roomB;
      
      return a.studentName.localeCompare(b.studentName);
    });

  // Calculate stats for current records
  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === "PRESENT").length;
  const absentCount = filteredRecords.filter((r) => r.status === "ABSENT").length;
  const presentRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header styling
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Shri Mauli Boys Hostel", 14, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Student Attendance Report", 14, 26);

    // Filter subtitle
    let filterText = "";
    if (filterMode === "SINGLE") {
      filterText = `Date: ${new Date(singleDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`;
    } else {
      const from = fromDate ? new Date(fromDate).toLocaleDateString("en-IN") : "Beginning";
      const to = toDate ? new Date(toDate).toLocaleDateString("en-IN") : "Today";
      filterText = `Period: ${from} to ${to}`;
    }
    doc.setFontSize(10);
    doc.text(filterText, 14, 32);

    // Metrics summary box in PDF
    doc.setFontSize(9);
    doc.text(`Total Records: ${totalRecords}  |  Present: ${presentCount}  |  Absent: ${absentCount}  |  Attendance Rate: ${presentRate}%`, 14, 38);

    // Generate table rows
    const rows = filteredRecords.map((rec) => [
      new Date(rec.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      rec.roomNumber,
      rec.studentName,
      rec.status === "PRESENT" ? "Present" : "Absent",
      rec.takenBy,
    ]);

    autoTable(doc, {
      startY: 44,
      head: [["Date", "Room No", "Resident Name", "Status", "Taken By"]],
      body: rows,
      theme: "striped",
      headStyles: {
        fillColor: [79, 70, 229], // Indigo Primary
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        3: { fontStyle: "bold" }, // Bold Status
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.cell.section === "body") {
          if (data.cell.text[0] === "Present") {
            data.cell.styles.textColor = [16, 185, 129]; // Emerald 500
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red 500
          }
        }
      },
    });

    const filename = `Attendance_Report_${filterMode === "SINGLE" ? singleDate : "Range"}.pdf`;
    doc.save(filename);
  };

  const isTodayDefault = filterMode === "SINGLE" && singleDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Attendance Console</h1>
          <p className="text-muted-foreground">Monitor daily student attendance, filter histories, and generate PDF reports.</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={filteredRecords.length === 0}
          className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <FileText size={18} /> Export PDF Report
        </button>
      </div>

      {/* Analytics Summary */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#121214]">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Checked</p>
            <h3 className="text-2xl font-black text-white">{totalRecords}</h3>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#121214]">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Present</p>
            <h3 className="text-2xl font-black text-emerald-500">{presentCount}</h3>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#121214]">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Absent</p>
            <h3 className="text-2xl font-black text-red-500">{absentCount}</h3>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#121214]">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Attendance Rate</p>
            <h3 className="text-2xl font-black text-primary">{presentRate}%</h3>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-[#121214] p-4 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Mode Switcher */}
          <div className="flex bg-[#16161a] p-1 rounded-xl border border-white/5 gap-1">
            <button
              onClick={() => setFilterMode("SINGLE")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                filterMode === "SINGLE" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
              }`}
            >
              Specific Date
            </button>
            <button
              onClick={() => setFilterMode("RANGE")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                filterMode === "RANGE" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
              }`}
            >
              Date Range
            </button>
          </div>

          {/* Actual inputs */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {filterMode === "SINGLE" ? (
              <div className="flex items-center gap-2 bg-[#16161a] border border-white/5 px-3 py-1.5 rounded-xl">
                <Calendar size={14} className="text-muted-foreground" />
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-white focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 bg-[#16161a] border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase mr-1">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 bg-[#16161a] border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase mr-1">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Resident Search */}
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search by student name or room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/5 bg-[#121214]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="p-6">Date</th>
                  <th className="p-6">Room No</th>
                  <th className="p-6">Resident</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={`${rec.sessionId}-${rec.studentId}`} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 font-medium text-white">
                      {new Date(rec.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-6">
                      <span className="bg-white/5 border border-white/5 text-xs font-bold px-2.5 py-1 rounded-lg text-white">
                        {rec.roomNumber}
                      </span>
                    </td>
                    <td className="p-6 font-semibold text-white">{rec.studentName}</td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        rec.status === "PRESENT" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.status === "PRESENT" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {rec.status === "PRESENT" ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td className="p-6 text-muted-foreground font-medium">{rec.takenBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214] max-w-2xl mx-auto">
          {isTodayDefault ? (
            <>
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Attendance Taken Today</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                No attendance sheets have been recorded for today yet. Use the staff link 
                <code className="text-xs bg-[#16161a] text-primary px-2 py-1 rounded mx-1.5">/sjabcxyz</code> 
                on a mobile device to record attendance.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Records Found</h3>
              <p className="text-muted-foreground text-sm">
                No attendance sheets match the selected date or date range filters.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
