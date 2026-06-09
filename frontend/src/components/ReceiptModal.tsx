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
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getMonthName = (dateStr: string) => {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("receipt-print-area");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3, // High resolution capture
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297; // A4 landscape width
      const pdfHeight = 210; // A4 landscape height

      // Scale keeping aspect ratio but fitting within A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Center vertically if image is shorter than A4 height
      const yOffset = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 0;

      pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
      pdf.save(`Receipt_SMBH_${payment.utr || "payment"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download receipt as PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine Fee Title and Month based on amount
  const isDeposit = payment.amount === 10000;
  const feeType = isDeposit ? "Hostel Deposit" : "Hostel Rent";
  const feeMonth = isDeposit ? "----" : getMonthName(payment.paymentDate);
  const academicYear = payment.student?.academicYear || "2025-26";
  const receiptNo = `SMBH/${isDeposit ? "deposit" : "rent"}${payment.id.slice(0, 5).toUpperCase()} /${academicYear}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full bg-[#121214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5 flex-shrink-0">
          <h3 className="text-lg font-bold text-white">Generate Fee Receipt</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download size={14} /> Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 text-muted-foreground hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="flex-1 overflow-auto py-6 flex justify-center bg-[#16161a] rounded-2xl border border-white/5 my-4">
          {/* Printable Receipt Area */}
          {/* We lock width in pixels to guarantee aspect ratio and consistent rendering on pdf generation */}
          <div
            id="receipt-print-area"
            className="w-[850px] min-h-[580px] bg-white text-black p-8 relative flex flex-col justify-between font-serif border-[12px] border-double border-black rounded-[40px] m-auto shadow-inner"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold tracking-wide text-black" style={{ fontFamily: "Georgia, serif" }}>
                Shri Mauli Boys Hostel
              </h1>
              <h2 className="text-xl font-bold text-black" style={{ fontFamily: "System-UI, sans-serif" }}>
                श्री माऊली मुलांचे वसतिगृह
              </h2>
            </div>

            {/* Receipt Date & Number Divider */}
            <div className="border-t border-b border-black py-2 mt-4 flex justify-between text-sm font-semibold">
              <div>Receipt Date: - &nbsp;{formatDate(payment.paymentDate)}</div>
              <div>Receipt No: - &nbsp;{receiptNo}</div>
            </div>

            {/* Receipt Details Area */}
            <div className="mt-6 flex-1 space-y-4">
              <h3 className="text-center text-lg font-bold underline uppercase tracking-widest">
                Receipt
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="font-bold mr-2">&#9670; Name of the Student :-</span>
                  <span className="border-b border-dotted border-black/40 flex-1 pb-0.5 capitalize">
                    {payment.student?.fullName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <span className="font-bold mr-2">&#9670; Course/Branch :-</span>
                    <span className="border-b border-dotted border-black/40 flex-1 pb-0.5 uppercase">
                      {payment.student?.course || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold mr-2">Year of Admission :-</span>
                    <span className="border-b border-dotted border-black/40 flex-1 pb-0.5">
                      {academicYear}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="font-bold mr-2">&#9670; Student Room No :-</span>
                  <span className="border-b border-dotted border-black/40 w-32 pb-0.5">
                    {payment.student?.room?.roomNumber || "N/A"}
                  </span>
                </div>

                <div className="pt-2 font-bold">&#9670; Fee Details</div>

                {/* Table */}
                <table className="w-full border-collapse border border-black text-center mt-2">
                  <thead>
                    <tr className="border-b border-black bg-black/5 font-bold">
                      <th className="border-r border-black py-2 w-1/3">Fee</th>
                      <th className="border-r border-black py-2 w-1/3">Month</th>
                      <th className="py-2 w-1/3">Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black py-3">{feeType}</td>
                      <td className="border-r border-black py-3">{feeMonth}</td>
                      <td className="py-3 font-semibold">{payment.amount}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment Receipt Details */}
                <div className="pt-4 space-y-1">
                  <div className="font-bold">&#9670; Receipt Details:-</div>
                  <div className="pl-4 space-y-0.5">
                    <div>
                      Mode Of Payment:- <span className="font-semibold">Online</span>
                    </div>
                    <div>
                      Transaction No:- <span className="font-semibold">{payment.utr || "N/A"}</span>
                    </div>
                    <div>
                      Transaction Date:- <span className="font-semibold">{formatDate(payment.paymentDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Warning */}
            <div className="text-right text-xs font-semibold italic mt-4">
              This is computer generated hostel receipt no signature required
            </div>

            {/* Footer Address */}
            <div className="border-t border-black pt-3 mt-6 text-center text-xs space-y-0.5 font-sans font-semibold">
              <div>
                C/O Shri Dilip Narayan Parab , 299 , Janawadi , Off Senapati Bapat Road, Pune – 411016
              </div>
              <div>
                Mail ID: -mrunparab@gmail.com &nbsp;&nbsp; Mobile: - 8329842125 / 9011063299 / 9881935885
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
