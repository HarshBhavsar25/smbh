"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Upload, Calendar, Loader2, Check, X, AlertTriangle, Clock, Eye 
} from "lucide-react";

export default function StudentFeesPage() {
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [amount, setAmount] = useState("5300");
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    
    if (!token || !studentId) {
      setError("User session not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // Fetch student profile
      const studRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${studentId}`, { headers });
      if (studRes.ok) {
        const studData = await studRes.json();
        setStudent(studData);
      }

      // Fetch all payments and filter for this student
      const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees`, { headers });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (Array.isArray(payData)) {
          const myPayments = payData.filter(pay => pay.studentId === studentId);
          setPayments(myPayments);
        }
      }
    } catch (err) {
      console.error("Error fetching fee data", err);
      setError("Failed to load payment data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");

    if (!token || !studentId) {
      setError("Session expired. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      let receiptUrl = null;

      // 1. Upload screenshot if exists
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees/upload`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload receipt screenshot");
        }

        const uploadData = await uploadRes.json();
        receiptUrl = uploadData.url;
      }

      // 2. Register Fee Payment
      const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          amount: Number(amount),
          utr,
          receiptUrl,
          status: "PENDING"
        })
      });

      if (!payRes.ok) {
        const errData = await payRes.json();
        throw new Error(errData.message || "Failed to submit payment details");
      }

      setSuccess("Payment registered successfully! Admin will verify and approve shortly.");
      setAmount("5300");
      setUtr("");
      setFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      fetchData();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Fee Portal</h1>
        <p className="text-muted-foreground">Submit monthly hostel fee details, upload receipts, and check transaction statuses.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submit Payment Form / Current Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Billing Status</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white font-medium">Monthly Rent:</span>
                  <span className="text-sm text-white font-bold">₹5,300</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white font-medium">This Month:</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    student?.feeStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                    "bg-red-500/10 text-red-500 border border-red-500/20"
                  }`}>
                    {student?.feeStatus === "PAID" ? <Check size={12} /> : <AlertTriangle size={12} />} 
                    {student?.feeStatus === "PAID" ? "PAID" : "NOT PAID"}
                  </span>
                </div>
                {student?.room && (
                  <div className="text-xs text-muted-foreground bg-[#16161a] p-3 rounded-xl border border-white/5 mb-2">
                    <p className="font-semibold text-white mb-1">Room Details:</p>
                    <p>Room: {student.room.roomNumber} ({student.room.type.replace('_', ' ')})</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Submission Form */}
            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214]">
              <h3 className="text-lg font-bold text-white mb-6">Submit Payment Details</h3>

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

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    placeholder="e.g. 15000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">UTR / Transaction ID</label>
                  <input
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    placeholder="Enter 12-digit UTR or Txn ID"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Upload Screenshot</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#16161a]"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {filePreview ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white font-medium">Change Image</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground font-medium text-center">Click to upload screenshot</p>
                        <p className="text-[10px] text-white/20 mt-1">PNG, JPG, JPEG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Submit Payment"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Payment History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214]">
              <h3 className="text-lg font-bold text-white mb-6">Payment History</h3>
              
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">UTR / Ref</th>
                        <th className="pb-4">Amount</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2 text-white font-medium">
                              <Calendar size={14} className="text-muted-foreground" />
                              {new Date(pay.paymentDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <code className="text-xs text-white/80 bg-white/5 px-2 py-1 rounded">{pay.utr || "N/A"}</code>
                          </td>
                          <td className="py-4 pr-4 font-bold text-white">
                            ₹{pay.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              pay.status === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                              pay.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                              "bg-amber-500/10 text-amber-500"
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {pay.receiptUrl ? (
                              <a 
                                href={pay.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Eye size={12} /> View Screenshot
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Receipt</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No payment history found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
