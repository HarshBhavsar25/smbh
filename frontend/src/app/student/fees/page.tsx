"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Upload, Calendar, Loader2, Check, X, AlertTriangle, Clock, Eye 
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StudentFeesPage() {
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [hostelFee, setHostelFee] = useState("5000");
  const [lightBill, setLightBill] = useState("300");
  const [amount, setAmount] = useState("5300");
  const [utr, setUtr] = useState("");
  const [sendingAccountName, setSendingAccountName] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any | null>(null);

  const currentLongMonth = new Date().toLocaleString("en-US", { month: "long" });
  const [hostelFeeMonth, setHostelFeeMonth] = useState(currentLongMonth);
  const [lightBillMonth, setLightBillMonth] = useState(currentLongMonth);
  const [laundry, setLaundry] = useState("0");
  const [laundryMonth, setLaundryMonth] = useState(currentLongMonth);
  const [balanceFeeMonth, setBalanceFeeMonth] = useState(currentLongMonth);
  const [balanceFee, setBalanceFee] = useState("0");
  
  const [paymentMode, setPaymentMode] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const rent = Number(hostelFee) || 0;
    const light = Number(lightBill) || 0;
    const laundryVal = Number(laundry) || 0;
    const balanceVal = Number(balanceFee) || 0;
    setAmount(String(rent + light + laundryVal + balanceVal));
  }, [hostelFee, lightBill, laundry, balanceFee]);

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
      let studData: any = null;
      if (studRes.ok) {
        studData = await studRes.json();
        setStudent(studData);
      }

      // Fetch settings
      const settingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees/settings`, { headers });
      let settingsData = { hostelRentRate: 5000, lightBillRate: 300, laundryRate: 200 };
      if (settingsRes.ok) {
        settingsData = await settingsRes.json();
      }

      // Initialize inputs based on rates and laundry opting status
      setHostelFee(String(settingsData.hostelRentRate));
      setLightBill(String(settingsData.lightBillRate));
      if (studData?.laundryOpted) {
        setLaundry(String(settingsData.laundryRate));
      } else {
        setLaundry("0");
      }

      // Fetch QR Code
      const qrRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees/qr-code`, { headers });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrCodeUrl(qrData.url);
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

      // 1. Upload screenshot if exists and mode is not cash
      if (file && paymentMode !== "Cash") {
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
          utr: paymentMode === "Cash" ? "CASH" : utr,
          receiptUrl: paymentMode === "Cash" ? null : receiptUrl,
          status: "PENDING",
          hostelFee: Number(hostelFee) || 0,
          lightBill: Number(lightBill) || 0,
          laundry: student?.laundryOpted ? (Number(laundry) || 0) : 0,
          balanceFee: Number(balanceFee) || 0,
          sendingAccountName: paymentMode === "Cash" ? "CASH" : sendingAccountName,
          hostelFeeMonth,
          lightBillMonth,
          laundryMonth: student?.laundryOpted ? laundryMonth : null,
          balanceFeeMonth,
          paymentMode,
          paymentDate: new Date(transactionDate).toISOString(),
        })
      });

      if (!payRes.ok) {
        const errData = await payRes.json();
        throw new Error(errData.message || "Failed to submit payment details");
      }

      setSuccess("Payment registered successfully! Admin will verify and approve shortly.");
      const nextBalance = student?.balanceFee || 0;
      setHostelFee("5000");
      setLightBill("300");
      setAmount(String(5000 + 300 + 0 + nextBalance));
      setUtr("");
      setSendingAccountName("");
      setLaundry("0");
      setPaymentMode("");
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
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Billing Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Hostel Rent:</span>
                    <span className="text-white font-semibold">₹{(Number(hostelFee) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Light Bill:</span>
                    <span className="text-white font-semibold">₹{(Number(lightBill) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Laundry Charges:</span>
                    <span className="text-white font-semibold">₹{Number(laundry) || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Remaining Balance:</span>
                    <span className="text-white font-semibold">₹{(student?.balanceFee || 0).toLocaleString("en-IN")}</span>
                  </div>
                  {Number(balanceFee) > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-400">
                      <span>Paying Balance:</span>
                      <span className="font-semibold">₹{(Number(balanceFee) || 0).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between font-bold text-base text-primary">
                    <span>Total Payment:</span>
                    <span>₹{((Number(hostelFee) || 0) + (Number(lightBill) || 0) + (Number(laundry) || 0) + (Number(balanceFee) || 0)).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 mb-4 pt-3 border-t border-white/5">
                  <span className="text-sm text-white font-medium">This Month Status:</span>
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
                {/* Dynamic amounts inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Hostel Rent (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={hostelFee}
                      onChange={(e) => setHostelFee(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Light Bill (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={lightBill}
                      onChange={(e) => setLightBill(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                      placeholder="e.g. 300"
                    />
                  </div>
                </div>

                {/* Month selectors for components */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Hostel Rent for Month</label>
                    <select
                      value={hostelFeeMonth}
                      onChange={(e) => setHostelFeeMonth(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Light Bill for Month</label>
                    <select
                      value={lightBillMonth}
                      onChange={(e) => setLightBillMonth(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {student?.laundryOpted && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Laundry Charges (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={laundry}
                        onChange={(e) => setLaundry(e.target.value)}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                        placeholder="e.g. 0"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Laundry for Month</label>
                      <select
                        value={laundryMonth}
                        onChange={(e) => setLaundryMonth(e.target.value)}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Remaining Balance (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={student?.balanceFee || 0}
                      className="w-full bg-[#16161a]/50 border border-white/5 rounded-xl py-3 px-4 text-muted-foreground focus:outline-none text-sm cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Paying Balance Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={balanceFee}
                      onChange={(e) => setBalanceFee(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                      placeholder="e.g. 0"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Balance Fee for Month</label>
                    <select
                      value={balanceFeeMonth}
                      onChange={(e) => setBalanceFeeMonth(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Payment Mode *</label>
                  <select
                    required
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm font-semibold"
                  >
                    <option value="">Select Payment Mode</option>
                    <option value="UPI / QR Scanner">UPI / QR Scanner</option>
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {paymentMode === "UPI / QR Scanner" && qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#16161a] text-center my-4">
                    <h4 className="text-sm font-bold text-white mb-3">Scan to Pay</h4>
                    <div className="w-40 h-40 bg-white p-2 rounded-2xl overflow-hidden relative shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCodeUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider font-semibold">UPI QR Code for Hostel Fees</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Transaction Date *</label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Grand Total (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={amount}
                      className="w-full bg-[#16161a]/30 border border-white/5 rounded-xl py-3 px-4 text-primary font-bold focus:outline-none text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                {paymentMode !== "Cash" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">UTR / Transaction ID *</label>
                      <input
                        type="text"
                        required={paymentMode !== "Cash"}
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                        placeholder="Enter 12-digit UTR or Txn ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Student Name / UPI Account Holder Name *</label>
                      <input
                        type="text"
                        required={paymentMode !== "Cash"}
                        value={sendingAccountName}
                        onChange={(e) => setSendingAccountName(e.target.value)}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                        placeholder="Account Holder's Name"
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
                  </>
                )}

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
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/5 bg-[#121214]">
              <h3 className="text-lg font-bold text-white mb-6">Payment History</h3>
              
              {payments.length > 0 ? (
                <>
                  {/* Desktop Table View (md and up) */}
                  <div className="hidden md:block overflow-x-auto">
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
                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3">
                                {pay.receiptUrl && (
                                  <a 
                                    href={pay.receiptUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white hover:underline"
                                  >
                                    <Eye size={12} /> Screenshot
                                  </a>
                                )}
                                {pay.status === "PAID" && (
                                  <button
                                    onClick={() => setSelectedPaymentForReceipt(pay)}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                                  >
                                    <Eye size={12} /> View Receipt
                                  </button>
                                )}
                                {pay.status !== "PAID" && !pay.receiptUrl && (
                                  <span className="text-xs text-muted-foreground">Pending Approval</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View (below md) */}
                  <div className="md:hidden space-y-4">
                    {payments.map((pay) => (
                      <div key={pay.id} className="p-4 rounded-2xl bg-[#16161a] border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {new Date(pay.paymentDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            pay.status === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                            pay.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                            "bg-amber-500/10 text-amber-500"
                          }`}>
                            {pay.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-baseline gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">UTR / Ref</p>
                            <code className="text-xs text-white/80 bg-white/5 px-2 py-0.5 rounded block w-fit mt-1 break-all">{pay.utr || "N/A"}</code>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Amount</p>
                            <p className="text-sm font-bold text-white mt-1">₹{pay.amount.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-4">
                          {pay.receiptUrl && (
                            <a 
                              href={pay.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white hover:underline"
                            >
                              <Eye size={12} /> Screenshot
                            </a>
                          )}
                          {pay.status === "PAID" && (
                            <button
                              onClick={() => setSelectedPaymentForReceipt(pay)}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                            >
                              <Eye size={12} /> View Receipt
                            </button>
                          )}
                          {pay.status !== "PAID" && !pay.receiptUrl && (
                            <span className="text-xs text-muted-foreground">Pending Approval</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
      <ReceiptModal
        isOpen={!!selectedPaymentForReceipt}
        onClose={() => setSelectedPaymentForReceipt(null)}
        payment={selectedPaymentForReceipt}
      />
    </div>
  );
}
