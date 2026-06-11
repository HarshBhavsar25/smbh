"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Calendar, Users, Loader2, Download, CheckCircle, XCircle, TrendingUp, AlertCircle, RefreshCw 
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const MONTHLY_FEE = 5300;

export default function ReportsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [reportType, setReportType] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Years for filter dropdown (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [studRes, payRes] = await Promise.all([
        fetch(`${API}/students`, { headers }),
        fetch(`${API}/fees`, { headers })
      ]);
      
      const studData = await studRes.json();
      const payData = await payRes.json();

      if (Array.isArray(studData)) setStudents(studData);
      if (Array.isArray(payData)) setPayments(payData);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic calculations for the report period
  const getReportData = () => {
    let hostelFeeCollected = 0;
    let securityDepositCollected = 0;
    let refundAmountPaid = 0;
    let totalReceivableAmount = 0; // Balance fee (outstanding) for active students

    const paidStudentsList: any[] = [];
    const unpaidStudentsList: any[] = [];

    students.forEach((student) => {
      // 1. Determine if student was active during the selected period
      const admissionDate = new Date(student.admissionDate);
      const leftDate = student.leftDate ? new Date(student.leftDate) : null;

      const admissionYear = admissionDate.getFullYear();
      const admissionMonth = admissionDate.getMonth();

      let isActiveInPeriod = false;

      if (reportType === "MONTHLY") {
        const targetDate = new Date(selectedYear, selectedMonth, 1);
        const nextMonthDate = new Date(selectedYear, selectedMonth + 1, 1);
        
        // Active if admitted on or before target month, and has not left before target month
        const hasAdmitted = new Date(admissionYear, admissionMonth, 1) <= targetDate;
        const hasNotLeft = !leftDate || new Date(leftDate.getFullYear(), leftDate.getMonth(), 1) >= targetDate;
        
        isActiveInPeriod = hasAdmitted && hasNotLeft;
      } else {
        // Active if admitted on or before target year, and has not left before target year
        const hasAdmitted = admissionYear <= selectedYear;
        const hasNotLeft = !leftDate || leftDate.getFullYear() >= selectedYear;

        isActiveInPeriod = hasAdmitted && hasNotLeft;
      }

      if (!isActiveInPeriod) return;

      // 2. Calculate balance fee dynamically up to the selected period
      // We loop through each month from admission date to end of selected period (or student left date)
      let currentYear = admissionYear;
      let currentMonth = admissionMonth;

      let endYear = selectedYear;
      let endMonth = reportType === "MONTHLY" ? selectedMonth : 11;

      // If student left, cap the ending calculation month
      if (leftDate) {
        const leftYear = leftDate.getFullYear();
        const leftMonth = leftDate.getMonth();
        if (leftYear < endYear || (leftYear === endYear && leftMonth < endMonth)) {
          endYear = leftYear;
          endMonth = leftMonth;
        }
      }

      // If selected period is before student admission, skip
      if (selectedYear < admissionYear || (selectedYear === admissionYear && reportType === "MONTHLY" && selectedMonth < admissionMonth)) {
        return;
      }

      let cumulativeBalance = 0;
      let studentPaidInPeriod = 0;

      // Loop month by month
      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        // Add monthly hostel charge
        cumulativeBalance += MONTHLY_FEE;

        // Find approved payments for this student in this specific month/year
        const approvedPaymentsForMonth = payments.filter((p) => {
          if (p.studentId !== student.id) return false;
          if (p.status !== "APPROVED" && p.status !== "PAID") return false;
          if (p.paymentType && p.paymentType !== "HOSTEL_FEE") return false;

          const pDate = new Date(p.paymentDate);
          return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
        });

        const totalMonthPayments = approvedPaymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
        cumulativeBalance -= totalMonthPayments;

        // Track how much student paid specifically within the selected report period
        if (reportType === "MONTHLY") {
          if (currentYear === selectedYear && currentMonth === selectedMonth) {
            studentPaidInPeriod += totalMonthPayments;
          }
        } else {
          if (currentYear === selectedYear) {
            studentPaidInPeriod += totalMonthPayments;
          }
        }

        // Advance to next month
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }

      // Add to total outstanding receivable if student is still in hostel or left within/after the period
      totalReceivableAmount += Math.max(0, cumulativeBalance);

      // Student record for the lists
      const studentRecord = {
        id: student.id,
        name: student.fullName,
        room: student.room ? `Room ${student.room.roomNumber}` : "Unassigned",
        paidInPeriod: studentPaidInPeriod,
        endingBalance: cumulativeBalance
      };

      if (cumulativeBalance <= 0) {
        paidStudentsList.push(studentRecord);
      } else {
        unpaidStudentsList.push(studentRecord);
      }
    });

    // 3. Calculate collected fees and deposits specifically in the selected period
    payments.forEach((payment) => {
      if (payment.status !== "APPROVED" && payment.status !== "PAID") return;

      const pDate = new Date(payment.paymentDate);
      const pYear = pDate.getFullYear();
      const pMonth = pDate.getMonth();

      let isInPeriod = false;
      if (reportType === "MONTHLY") {
        isInPeriod = pYear === selectedYear && pMonth === selectedMonth;
      } else {
        isInPeriod = pYear === selectedYear;
      }

      if (isInPeriod) {
        if (payment.paymentType === "SECURITY_DEPOSIT") {
          securityDepositCollected += payment.amount;
        } else {
          // Default paymentType is hostel fee
          hostelFeeCollected += payment.amount;
        }
      }
    });

    // Also include security deposits from newly admitted students if no explicit payments exist
    students.forEach((student) => {
      const admissionDate = new Date(student.admissionDate);
      const admYear = admissionDate.getFullYear();
      const admMonth = admissionDate.getMonth();
      
      let admittedInPeriod = false;
      if (reportType === "MONTHLY") {
        admittedInPeriod = admYear === selectedYear && admMonth === selectedMonth;
      } else {
        admittedInPeriod = admYear === selectedYear;
      }

      // If admitted in the period, and student profile lists a deposit
      if (admittedInPeriod && student.securityDeposit > 0) {
        // Only count if there isn't already a security deposit payment recorded for this student to avoid double-counting
        const hasSecurityPayment = payments.some(
          p => p.studentId === student.id && 
          p.paymentType === "SECURITY_DEPOSIT" && 
          (p.status === "APPROVED" || p.status === "PAID")
        );
        if (!hasSecurityPayment) {
          securityDepositCollected += student.securityDeposit;
        }
      }
    });

    // 4. Calculate refunds paid back specifically in this period
    students.forEach((student) => {
      if (!student.hasLeft || !student.leftDate) return;

      const lDate = new Date(student.leftDate);
      const lYear = lDate.getFullYear();
      const lMonth = lDate.getMonth();

      let leftInPeriod = false;
      if (reportType === "MONTHLY") {
        leftInPeriod = lYear === selectedYear && lMonth === selectedMonth;
      } else {
        leftInPeriod = lYear === selectedYear;
      }

      if (leftInPeriod && student.refundAmount > 0) {
        refundAmountPaid += student.refundAmount;
      }
    });

    const totalReceivedAmount = hostelFeeCollected + securityDepositCollected;

    return {
      hostelFeeCollected,
      securityDepositCollected,
      refundAmountPaid,
      totalReceivedAmount,
      totalReceivableAmount,
      paidStudents: paidStudentsList,
      unpaidStudents: unpaidStudentsList
    };
  };

  const reportData = getReportData();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const periodText = reportType === "MONTHLY" 
        ? `${months[selectedMonth]} ${selectedYear}`
        : `${selectedYear}`;

      // Header Design
      doc.setFillColor(15, 23, 42); // slate-900 background
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Shree Mauli Boys Hostel", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Financial Performance Report — ${reportType} (${periodText})`, 15, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 155, 28);

      // Financial Metrics Table
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Financial Summary", 15, 52);

      const summaryRows = [
        ["Hostel Fee Collected", `INR ${reportData.hostelFeeCollected.toLocaleString("en-IN")}`],
        ["Security Deposit Collected", `INR ${reportData.securityDepositCollected.toLocaleString("en-IN")}`],
        ["Total Received Amount", `INR ${reportData.totalReceivedAmount.toLocaleString("en-IN")}`],
        ["Balance Fee Outstanding (Receivable)", `INR ${reportData.totalReceivableAmount.toLocaleString("en-IN")}`],
        ["Refund Amount Paid", `INR ${reportData.refundAmountPaid.toLocaleString("en-IN")}`],
      ];

      autoTable(doc, {
        startY: 57,
        head: [["Metric Description", "Amount"]],
        body: summaryRows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo-600
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          1: { halign: "right", fontStyle: "bold" }
        }
      });

      // Paid Students List Table
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Paid Students (${reportData.paidStudents.length})`, 15, currentY);

      const paidRows = reportData.paidStudents.map(s => [
        s.name, 
        s.room, 
        `INR ${s.paidInPeriod.toLocaleString("en-IN")}`, 
        `INR ${s.endingBalance.toLocaleString("en-IN")}`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Student Name", "Room", "Paid in Period", "Ending Balance"]],
        body: paidRows.length > 0 ? paidRows : [["No records found", "", "", ""]],
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: 255 }, // Emerald-500
        styles: { fontSize: 9, cellPadding: 3 }
      });

      // Unpaid Students List Table
      currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Unpaid Students (${reportData.unpaidStudents.length})`, 15, currentY);

      const unpaidRows = reportData.unpaidStudents.map(s => [
        s.name, 
        s.room, 
        `INR ${s.paidInPeriod.toLocaleString("en-IN")}`, 
        `INR ${s.endingBalance.toLocaleString("en-IN")}`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Student Name", "Room", "Paid in Period", "Pending Balance"]],
        body: unpaidRows.length > 0 ? unpaidRows : [["No records found", "", "", ""]],
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68], textColor: 255 }, // Red-500
        styles: { fontSize: 9, cellPadding: 3 }
      });

      // Footer signature
      currentY = (doc as any).lastAutoTable.finalY + 25;
      if (currentY > 260) {
        doc.addPage();
        currentY = 30;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Authorized Signature:", 15, currentY);
      doc.line(15, currentY + 10, 80, currentY + 10);
      doc.text("Hostel Administrator", 15, currentY + 15);

      const filename = `hostel_report_${reportType.toLowerCase()}_${periodText.replace(" ", "_")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0e12]">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary mx-auto" size={40} />
          <p className="text-muted-foreground text-sm font-medium">Assembling financial records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <BarChart3 className="text-primary" size={26} /> Financial Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analyze hostel fee collections, security deposits, balances, and payouts.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 flex-shrink-0"
        >
          {isExporting ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Generating PDF...
            </>
          ) : (
            <>
              <Download size={16} />
              Export PDF Report
            </>
          )}
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report Type</label>
          <div className="flex bg-[#16161a] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setReportType("MONTHLY")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                reportType === "MONTHLY" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setReportType("YEARLY")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                reportType === "YEARLY" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-[#16161a] border border-white/5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {reportType === "MONTHLY" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-[#16161a] border border-white/5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end pb-1 justify-end md:justify-start">
          <button
            onClick={fetchData}
            className="px-4 py-2.5 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#16161a]/80 backdrop-blur border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Hostel Fees Collected</span>
          <span className="text-2xl font-bold mt-2 block text-white">
            ₹{reportData.hostelFeeCollected.toLocaleString("en-IN")}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">Total approved hostel fees</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#16161a]/80 backdrop-blur border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Security Deposits</span>
          <span className="text-2xl font-bold mt-2 block text-emerald-400">
            ₹{reportData.securityDepositCollected.toLocaleString("en-IN")}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">Deposits collected in period</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#16161a]/80 backdrop-blur border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Refund Amount Paid</span>
          <span className="text-2xl font-bold mt-2 block text-red-400">
            ₹{reportData.refundAmountPaid.toLocaleString("en-IN")}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">Deposits refunded back to students</p>
        </div>

        {/* Card 4 */}
        <div className="bg-[#16161a]/80 backdrop-blur border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Outstanding Receivable</span>
          <span className="text-2xl font-bold mt-2 block text-yellow-500">
            ₹{reportData.totalReceivableAmount.toLocaleString("en-IN")}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">Pending Balance Fee to collect</p>
        </div>
      </div>

      {/* Aggregate Collected Panel */}
      <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/15 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary block">Aggregate Income</span>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="text-3xl font-extrabold text-white">
              ₹{reportData.totalReceivedAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-muted-foreground">Total Received (Fees + Deposits)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp className="text-primary animate-pulse" size={24} />
          <div className="text-xs text-muted-foreground/80 leading-relaxed max-w-xs">
            Reflects overall capital inflows from admissions and rent during the selected time boundary.
          </div>
        </div>
      </div>

      {/* Main Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Paid Students */}
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={20} />
              <h3 className="font-bold text-sm">Paid Students ({reportData.paidStudents.length})</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Clear Balance
            </span>
          </div>
          
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {reportData.paidStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                No students match this status.
              </div>
            ) : (
              reportData.paidStudents.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-medium text-sm block">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.room}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">
                      Paid: ₹{s.paidInPeriod.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      Balance: ₹{s.endingBalance}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unpaid Students */}
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-red-500/5">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-400" size={20} />
              <h3 className="font-bold text-sm">Unpaid Students ({reportData.unpaidStudents.length})</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Pending Fees
            </span>
          </div>
          
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {reportData.unpaidStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                No students match this status.
              </div>
            ) : (
              reportData.unpaidStudents.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-medium text-sm block">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.room}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-yellow-500 block">
                      Paid: ₹{s.paidInPeriod.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-bold text-red-400 block mt-0.5">
                      Pending: ₹{s.endingBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
