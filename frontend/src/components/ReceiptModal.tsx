"use client";

import { X, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

export default function ReceiptModal({ isOpen, onClose, payment }: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !payment) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  const getMonthName = (dateStr: string) => {
    if (!dateStr) return "----";
    return new Date(dateStr).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const getPreviousMonthName = (dateStr: string) => {
    if (!dateStr) return "----";
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const isDeposit = payment.amount === 10000;
  const academicYear = payment.student?.academicYear || "2025-26";
  const receiptNo = `SMBH/${isDeposit ? "deposit" : "rent"}-${payment.id.slice(0, 5).toUpperCase()}/${academicYear}`;
  const studentName = payment.student?.fullName || "N/A";
  const course = payment.student?.course || "N/A";
  const roomNo = payment.student?.room?.roomNumber || "N/A";
  const utr = payment.utr || "N/A";
  const txnDate = formatDate(payment.paymentDate);
  const receiptDate = formatDate(payment.paymentDate);
  const admissionDate = payment.student?.admissionDate ? formatDate(payment.student.admissionDate) : "N/A";

  // Split payment details into rows
  interface FeeRow {
    type: string;
    month: string;
    amount: number;
  }

  const feeRows: FeeRow[] = [];
  if (isDeposit) {
    feeRows.push({
      type: "Hostel Deposit",
      month: "----",
      amount: payment.amount,
    });
  } else {
    if (payment.amount >= 5000) {
      feeRows.push({
        type: "Hostel Rent",
        month: getMonthName(payment.paymentDate),
        amount: 5000,
      });
      if (payment.amount > 5000) {
        feeRows.push({
          type: "Electricity Bill",
          month: getPreviousMonthName(payment.paymentDate),
          amount: payment.amount - 5000,
        });
      }
    } else {
      feeRows.push({
        type: "Hostel Rent (Partial)",
        month: getMonthName(payment.paymentDate),
        amount: payment.amount,
      });
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("receipt-print-area");
      if (!element) {
        throw new Error("Print area element not found in DOM");
      }

      // Convert HTML element to a high-resolution PNG using browser's native SVG renderer
      const imgData = await toPng(element, {
        pixelRatio: 2.0, // Scale for crisp PDF text
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297; // A4 landscape width
      const pdfHeight = 210; // A4 landscape height

      // Render image to fill the page
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_SMBH_${utr !== "N/A" ? utr : payment.id.slice(0, 8)}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      alert(`Failed to download receipt as PDF. Error: ${err.message || err}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    // Fullscreen overlay — scrollable, starts below fixed navbar (mt-24)
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      {/* Card — anchored at top to avoid being obscured by mobile viewports */}
      <div
        className="relative mx-auto mt-24 mb-12 max-w-4xl w-full bg-[#121214] border border-white/10 rounded-3xl shadow-2xl p-5 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <h3 className="text-base font-bold text-white">Fee Receipt Preview</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <><Loader2 size={13} className="animate-spin" /> Generating…</>
              ) : (
                <><Download size={13} /> Download PDF</>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable receipt preview */}
        <div className="overflow-x-auto mt-4 bg-[#16161a] rounded-2xl border border-white/5 p-4 flex justify-center">
          {/* Fixed-width white receipt card */}
          <div
            id="receipt-print-area"
            className="w-[820px] min-h-[560px] bg-white text-black p-8 flex flex-col justify-between border-[10px] border-double border-black rounded-[32px] shadow-inner text-[13px] shrink-0"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-wide">Shri Mauli Boys Hostel</h1>
              <h2 className="text-lg font-bold mt-0.5">श्री माऊली मुलांचे वसतिगृह</h2>
            </div>

            {/* Receipt No / Date bar */}
            <div className="border-t border-b border-black py-2 mt-4 flex justify-between text-xs font-semibold">
              <span>Receipt Date: {receiptDate}</span>
              <span>Receipt No: {receiptNo}</span>
            </div>

            {/* Body */}
            <div className="mt-5 flex-1 space-y-3">
              <h3 className="text-center font-bold underline uppercase tracking-widest text-sm">Receipt</h3>

              <div className="flex items-center gap-2">
                <span className="font-bold whitespace-nowrap">◆ Name of the Student :-</span>
                <span className="border-b border-dotted border-black/40 flex-1 capitalize">{studentName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold whitespace-nowrap">◆ Course/Branch :-</span>
                  <span className="border-b border-dotted border-black/40 flex-1 uppercase">{course}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold whitespace-nowrap">Date of Admission :-</span>
                  <span className="border-b border-dotted border-black/40 flex-1">{admissionDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold whitespace-nowrap">◆ Student Room No :-</span>
                <span className="border-b border-dotted border-black/40 w-28">{roomNo}</span>
              </div>

              <p className="font-bold pt-1">◆ Fee Details</p>

              <table className="w-full border-collapse border border-black text-center text-xs">
                <thead>
                  <tr className="bg-black/5 font-bold border-b border-black">
                    <th className="border-r border-black py-2 w-1/3">Fee</th>
                    <th className="border-r border-black py-2 w-1/3">Month</th>
                    <th className="py-2 w-1/3">Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((row, index) => (
                    <tr key={index} className={index < feeRows.length - 1 ? "border-b border-black" : ""}>
                      <td className="border-r border-black py-3">{row.type}</td>
                      <td className="border-r border-black py-3">{row.month}</td>
                      <td className="py-3 font-bold">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 space-y-1">
                <p className="font-bold">◆ Receipt Details :-</p>
                <div className="pl-4 space-y-0.5">
                  <p>Mode Of Payment :- <span className="font-semibold">Online</span></p>
                  <p>Transaction No :- <span className="font-semibold">{utr}</span></p>
                  <p>Transaction Date :- <span className="font-semibold">{txnDate}</span></p>
                </div>
              </div>
            </div>

            {/* Signature note */}
            <p className="text-right text-[10px] italic font-semibold mt-4">
              This is a computer generated hostel receipt, no signature required.
            </p>

            {/* Footer */}
            <div className="border-t border-black pt-3 mt-4 text-center text-[10px] font-semibold space-y-0.5">
              <p>C/O Shri Dilip Narayan Parab, 299, Janawadi, Off Senapati Bapat Road, Pune – 411016</p>
              <p>Mail ID: mrunparab@gmail.com &nbsp;&nbsp; Mobile: 8329842125 / 9011063299 / 9881935885</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
