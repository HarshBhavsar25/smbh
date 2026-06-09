"use client";

import { X, Download, Loader2 } from "lucide-react";
import { useState } from "react";

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

  const isDeposit = payment.amount === 10000;
  const feeType = isDeposit ? "Hostel Deposit" : "Hostel Rent";
  const feeMonth = isDeposit ? "----" : getMonthName(payment.paymentDate);
  const academicYear = payment.student?.academicYear || "2025-26";
  const receiptNo = `SMBH/${isDeposit ? "deposit" : "rent"}-${payment.id.slice(0, 5).toUpperCase()}/${academicYear}`;
  const studentName = payment.student?.fullName || "N/A";
  const course = payment.student?.course || "N/A";
  const roomNo = payment.student?.room?.roomNumber || "N/A";
  const utr = payment.utr || "N/A";
  const txnDate = formatDate(payment.paymentDate);
  const receiptDate = formatDate(payment.paymentDate);

  // ─── Pure jsPDF drawing — no html2canvas, works everywhere ───────────────
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297; // page width  (A4 landscape)
      const H = 210; // page height

      // ── Outer double border ──────────────────────────────────────────────
      const pad = 8;
      doc.setDrawColor(0);
      doc.setLineWidth(1.5);
      doc.rect(pad, pad, W - pad * 2, H - pad * 2);
      doc.setLineWidth(0.4);
      doc.rect(pad + 3, pad + 3, W - (pad + 3) * 2, H - (pad + 3) * 2);

      const lx = pad + 10; // left content margin
      const rx = W - pad - 10; // right content margin
      let y = pad + 14;

      // ── Title block ──────────────────────────────────────────────────────
      doc.setFont("times", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Shri Mauli Boys Hostel", W / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(14);
      doc.text("\u0936\u094d\u0930\u0940 \u092e\u093e\u090a\u0932\u0940 \u092e\u0941\u0932\u093e\u0902\u091a\u0947 \u0935\u0938\u0924\u093f\u0917\u0943\u0939", W / 2, y, { align: "center" });
      y += 5;

      // ── Receipt date / number bar ────────────────────────────────────────
      doc.setLineWidth(0.3);
      doc.line(lx, y, rx, y);
      y += 5;
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.text(`Receipt Date: ${receiptDate}`, lx, y);
      doc.text(`Receipt No: ${receiptNo}`, rx, y, { align: "right" });
      y += 2;
      doc.line(lx, y, rx, y);
      y += 8;

      // ── "RECEIPT" heading ────────────────────────────────────────────────
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("RECEIPT", W / 2, y, { align: "center" });
      doc.line(W / 2 - 15, y + 1, W / 2 + 15, y + 1); // underline
      y += 9;

      // ── Student details ──────────────────────────────────────────────────
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      const labelStyle = () => doc.setFont("times", "bold");
      const valueStyle = () => doc.setFont("times", "normal");

      labelStyle();
      doc.text("\u25C6 Name of the Student :-", lx, y);
      valueStyle();
      doc.text(studentName, lx + 52, y);
      doc.line(lx + 52, y + 0.5, rx, y + 0.5); // dotted underline approx
      y += 7;

      labelStyle();
      doc.text("\u25C6 Course / Branch :-", lx, y);
      valueStyle();
      doc.text(course.toUpperCase(), lx + 40, y);
      doc.line(lx + 40, y + 0.5, W / 2 - 5, y + 0.5);

      labelStyle();
      doc.text("Year of Admission :-", W / 2 + 5, y);
      valueStyle();
      doc.text(academicYear, W / 2 + 48, y);
      doc.line(W / 2 + 48, y + 0.5, rx, y + 0.5);
      y += 7;

      labelStyle();
      doc.text("\u25C6 Student Room No :-", lx, y);
      valueStyle();
      doc.text(roomNo, lx + 42, y);
      doc.line(lx + 42, y + 0.5, lx + 80, y + 0.5);
      y += 8;

      // ── Fee Details heading ──────────────────────────────────────────────
      labelStyle();
      doc.text("\u25C6 Fee Details", lx, y);
      y += 6;

      // ── Fee table ────────────────────────────────────────────────────────
      const tl = lx; // table left
      const tw = rx - lx; // table width
      const col = tw / 3;
      const rowH = 9;

      // Header row background
      doc.setFillColor(230, 230, 230);
      doc.rect(tl, y, tw, rowH, "F");
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(tl, y, tw, rowH);
      doc.line(tl + col, y, tl + col, y + rowH);
      doc.line(tl + col * 2, y, tl + col * 2, y + rowH);

      doc.setFont("times", "bold");
      doc.setFontSize(9.5);
      doc.text("Fee", tl + col / 2, y + 6, { align: "center" });
      doc.text("Month", tl + col + col / 2, y + 6, { align: "center" });
      doc.text("Amount (Rs)", tl + col * 2 + col / 2, y + 6, { align: "center" });
      y += rowH;

      // Data row
      doc.setFillColor(255, 255, 255);
      doc.rect(tl, y, tw, rowH, "F");
      doc.rect(tl, y, tw, rowH);
      doc.line(tl + col, y, tl + col, y + rowH);
      doc.line(tl + col * 2, y, tl + col * 2, y + rowH);

      doc.setFont("times", "normal");
      doc.text(feeType, tl + col / 2, y + 6, { align: "center" });
      doc.text(feeMonth, tl + col + col / 2, y + 6, { align: "center" });
      doc.setFont("times", "bold");
      doc.text(String(payment.amount), tl + col * 2 + col / 2, y + 6, { align: "center" });
      y += rowH + 6;

      // ── Receipt Details ──────────────────────────────────────────────────
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.text("\u25C6 Receipt Details :-", lx, y);
      y += 6;
      doc.setFont("times", "normal");
      doc.text(`Mode Of Payment:-  Online`, lx + 6, y);
      y += 5.5;
      doc.text(`Transaction No:-  ${utr}`, lx + 6, y);
      y += 5.5;
      doc.text(`Transaction Date:-  ${txnDate}`, lx + 6, y);
      y += 7;

      // ── Signature note ───────────────────────────────────────────────────
      doc.setFont("times", "italic");
      doc.setFontSize(8);
      doc.text("This is a computer generated hostel receipt, no signature required.", rx, y, { align: "right" });
      y += 6;

      // ── Footer ───────────────────────────────────────────────────────────
      doc.setLineWidth(0.3);
      doc.line(lx, y, rx, y);
      y += 5;
      doc.setFont("times", "bold");
      doc.setFontSize(8.5);
      doc.text(
        "C/O Shri Dilip Narayan Parab, 299, Janawadi, Off Senapati Bapat Road, Pune \u2013 411016",
        W / 2, y, { align: "center" }
      );
      y += 5;
      doc.text(
        "Mail ID: mrunparab@gmail.com     Mobile: 8329842125 / 9011063299 / 9881935885",
        W / 2, y, { align: "center" }
      );

      doc.save(`Receipt_SMBH_${utr !== "N/A" ? utr : payment.id.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    // Fullscreen overlay — scrollable, starts at top (navbar is fixed ~h-20 so pt-20 clears it)
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      {/* Card — anchored at top, not centred, so it's never hidden behind navbar */}
      <div
        className="relative mx-auto mt-20 mb-8 max-w-4xl w-full bg-[#121214] border border-white/10 rounded-3xl shadow-2xl p-5 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ────────────────────────────────────────────── */}
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

        {/* ── Scrollable receipt preview ───────────────────────────────── */}
        <div className="overflow-x-auto mt-4 bg-[#16161a] rounded-2xl border border-white/5 p-4">
          {/* Fixed-width white receipt card — scrolls horizontally on small screens */}
          <div
            className="w-[820px] min-h-[560px] bg-white text-black p-8 mx-auto flex flex-col justify-between border-[10px] border-double border-black rounded-[32px] shadow-inner text-[13px]"
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
                  <span className="font-bold whitespace-nowrap">Year of Admission :-</span>
                  <span className="border-b border-dotted border-black/40 flex-1">{academicYear}</span>
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
                  <tr>
                    <td className="border-r border-black py-3">{feeType}</td>
                    <td className="border-r border-black py-3">{feeMonth}</td>
                    <td className="py-3 font-bold">{payment.amount}</td>
                  </tr>
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
