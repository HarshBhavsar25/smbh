"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Plus, Trash2, Calendar, Users, Loader2, X, AlertTriangle, 
  Check, Search, Eye, Filter, Upload, Download, QrCode
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FeesAdminPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PENDING, PAID, REJECTED
  const [timeFilter, setTimeFilter] = useState("ALL_TIME"); // ALL_TIME, THIS_MONTH, THIS_YEAR
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any | null>(null);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<any | null>(null);

  // QR Code Settings
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Manual payment recording form
  const [formData, setFormData] = useState<any>({
    studentId: "",
    hostelFee: "5000",
    hostelFeeMonth: new Date().toLocaleString("en-US", { month: "long" }),
    lightBill: "300",
    lightBillMonth: new Date().toLocaleString("en-US", { month: "long" }),
    laundry: "0",
    laundryMonth: new Date().toLocaleString("en-US", { month: "long" }),
    balanceFee: "0",
    balanceFeeMonth: new Date().toLocaleString("en-US", { month: "long" }),
    sendingAccountName: "",
    status: "PAID",
    utr: "",
    paymentMode: "Cash",
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Sync remaining balance when student changes in manual payment modal
  useEffect(() => {
    if (formData.studentId) {
      const selectedStudent = students.find(s => s.id === formData.studentId);
      if (selectedStudent) {
        setFormData((prev: any) => ({
          ...prev,
          balanceFee: String(selectedStudent.balanceFee || 0)
        }));
      }
    }
  }, [formData.studentId, students]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      const payRes = await fetch(`${API}/fees`, { headers });
      const payData = await payRes.json();
      if (Array.isArray(payData)) {
        setPayments(payData);
      }

      const studRes = await fetch(`${API}/students`, { headers });
      const studData = await studRes.json();
      if (Array.isArray(studData)) {
        setStudents(studData);
      }

      const qrRes = await fetch(`${API}/fees/qr-code`, { headers });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrCodeUrl(qrData.url);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    const currentLongMonth = new Date().toLocaleString("en-US", { month: "long" });
    setFormData({
      studentId: "",
      hostelFee: "5000",
      hostelFeeMonth: currentLongMonth,
      lightBill: "300",
      lightBillMonth: currentLongMonth,
      laundry: "0",
      laundryMonth: currentLongMonth,
      balanceFee: "0",
      balanceFeeMonth: currentLongMonth,
      sendingAccountName: "",
      status: "PAID",
      utr: "",
      paymentMode: "Cash",
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setError("");
    setIsDropdownOpen(false);
    setDropdownSearch("");
    setIsModalOpen(true);
  };

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingQr(true);
    try {
      const res = await fetch(`${API}/fees/qr-code/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.url);
        alert("QR Code updated successfully!");
      } else {
        alert("Failed to upload QR Code.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading QR Code.");
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    const hFee = Number(formData.hostelFee) || 0;
    const lBill = Number(formData.lightBill) || 0;
    const laund = Number(formData.laundry) || 0;
    const balFee = Number(formData.balanceFee) || 0;
    const calculatedAmount = hFee + lBill + laund + balFee;

    try {
      const res = await fetch(`${API}/fees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          amount: calculatedAmount,
          status: formData.status,
          utr: formData.utr || "OFFLINE_RECORD",
          sendingAccountName: formData.sendingAccountName || "Cash / Direct Bank Transfer",
          hostelFee: hFee,
          lightBill: lBill,
          laundry: laund,
          balanceFee: balFee,
          hostelFeeMonth: formData.hostelFeeMonth,
          lightBillMonth: formData.lightBillMonth,
          laundryMonth: formData.laundryMonth,
          balanceFeeMonth: formData.balanceFeeMonth,
          paymentMode: formData.paymentMode,
          paymentDate: new Date(formData.paymentDate).toISOString()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create fee payment record");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/fees/${id}/approve`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        setSelectedPaymentDetails(null);
      }
    } catch (err) {
      console.error("Approve error", err);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this payment request?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/fees/${id}/reject`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        setSelectedPaymentDetails(null);
      }
    } catch (err) {
      console.error("Reject error", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/fees/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Delete payment error", err);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((pay) => {
    const nameMatch = pay.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      pay.sendingAccountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      pay.utr?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "ALL" || pay.status === statusFilter;
    
    // Time filter
    const payDate = new Date(pay.paymentDate);
    const now = new Date();
    let timeMatch = true;
    if (timeFilter === "THIS_MONTH") {
      timeMatch = payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear();
    } else if (timeFilter === "THIS_YEAR") {
      timeMatch = payDate.getFullYear() === now.getFullYear();
    }

    return nameMatch && statusMatch && timeMatch;
  });

  const filteredPendingResidents = students
    .filter(s => s.feeStatus === "PENDING" || s.feeStatus === "REJECTED" || !s.feeStatus)
    .filter(s => s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Analytics
  const totalCollected = payments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingApprovalsCount = payments.filter(p => p.status === "PENDING").length;
  const pendingStudentsCount = students.filter(s => s.feeStatus === "PENDING").length;
  const paidStudentsCount = students.filter(s => s.feeStatus === "PAID").length;

  return (
    <div className="space-y-6">
      
      {/* Header and Quick Settings */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fee Management</h1>
          <p className="text-muted-foreground">Track billing collections, pending student fees, and verify uploads.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* QR Code Upload Setting */}
          <div className="relative">
            <input 
              type="file" 
              ref={qrInputRef}
              onChange={handleQrCodeUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => qrInputRef.current?.click()}
              disabled={isUploadingQr}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium text-sm flex items-center gap-2 border border-white/5 transition-all"
            >
              {isUploadingQr ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <QrCode size={16} className="text-primary" />
              )}
              {qrCodeUrl ? "Change Portal QR Code" : "Upload UPI QR Code"}
            </button>
          </div>

          <button 
            onClick={handleOpenModal}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Record Fee Payment
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => setStatusFilter("PAID")}
          className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] cursor-pointer hover:border-primary/30 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Collected</p>
          <h3 className="text-3xl font-black text-white">₹{totalCollected.toLocaleString("en-IN")}</h3>
        </div>
        <div 
          onClick={() => setStatusFilter("PENDING")}
          className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] cursor-pointer hover:border-amber-500/30 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending Approvals</p>
          <h3 className="text-3xl font-black text-amber-500">{pendingApprovalsCount}</h3>
        </div>
        <div 
          onClick={() => setStatusFilter("PAID")}
          className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] cursor-pointer hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Paid Residents</p>
          <h3 className="text-3xl font-black text-emerald-500">{paidStudentsCount}</h3>
        </div>
        <div 
          onClick={() => setStatusFilter("PENDING_RESIDENTS")}
          className="glass-card p-6 rounded-3xl border border-white/5 bg-[#121214] cursor-pointer hover:border-red-500/30 hover:-translate-y-0.5 transition-all"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending Residents</p>
          <h3 className="text-3xl font-black text-red-500">{pendingStudentsCount}</h3>
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#121214] p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search resident, sender, UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex flex-wrap bg-[#16161a] p-1 rounded-xl border border-white/5 gap-1">
            {[
              { id: "ALL", label: "All Transactions" },
              { id: "PENDING", label: "Pending Approvals" },
              { id: "PENDING_RESIDENTS", label: "Pending Residents" },
              { id: "PAID", label: "Paid" },
              { id: "REJECTED", label: "Rejected" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-[#16161a] border border-white/5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="ALL_TIME">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_YEAR">This Year</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : statusFilter === "PENDING_RESIDENTS" ? (
        filteredPendingResidents.length > 0 ? (
          <div className="glass-card rounded-3xl overflow-hidden border border-white/5 bg-[#121214]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="p-6">Resident</th>
                    <th className="p-6">Contact Info</th>
                    <th className="p-6">Monthly Fee Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredPendingResidents.map((stud) => {
                    const pendingTx = payments.find(p => p.studentId === stud.id && p.status === "PENDING");
                    return (
                      <tr key={stud.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6">
                          <div className="font-semibold text-white">{stud.fullName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {stud.room ? `Room ${stud.room.roomNumber}` : 'Unassigned'}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="text-white font-medium">{stud.mobile}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Parent: {stud.parentName} ({stud.parentContact})</div>
                        </td>
                        <td className="p-6">
                          {pendingTx ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500">
                              Verification Pending (₹{pendingTx.amount.toLocaleString("en-IN")})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500">
                              No Upload / Submission
                            </span>
                          )}
                        </td>
                        <td className="p-6 text-right">
                          {pendingTx ? (
                            <button
                              onClick={() => {
                                setStatusFilter("PENDING");
                                setSearchTerm(stud.fullName);
                              }}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
                            >
                              Review Upload
                            </button>
                          ) : (
                            <a
                              href={`https://wa.me/${stud.mobile.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-bold text-white transition-colors"
                            >
                              Send Reminder
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Pending Residents</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">All residents have paid their fees for the filtered period!</p>
          </div>
        )
      ) : filteredPayments.length > 0 ? (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/5 bg-[#121214]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="p-6">Resident</th>
                  <th className="p-6">Sender / UTR</th>
                  <th className="p-6">Transaction Date</th>
                  <th className="p-6">Amount Paid</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div className="font-semibold text-white">{pay.student?.fullName || "Unknown Student"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {pay.student?.room ? `Room ${pay.student.room.roomNumber}` : 'Unassigned'}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-white text-xs font-medium truncate max-w-[180px]" title={pay.sendingAccountName}>
                        {pay.sendingAccountName || "N/A"}
                      </div>
                      <code className="text-[10px] bg-white/5 text-muted-foreground px-1.5 py-0.5 rounded mt-1 block w-fit">{pay.utr || "N/A"}</code>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar size={14} className="text-muted-foreground" />
                        {new Date(pay.paymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-white">₹{pay.amount.toLocaleString("en-IN")}</div>
                      {pay.hostelFee !== undefined && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Rent: ₹{pay.hostelFee} | Light: ₹{pay.lightBill}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        pay.status === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                        pay.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                        "bg-amber-500/10 text-amber-500"
                      }`}>
                        <CreditCard size={12} /> {pay.status}
                      </span>
                    </td>
                    <td className="p-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPaymentDetails(pay)}
                        className="p-2 hover:bg-white/5 rounded-lg text-primary hover:text-white transition-colors"
                        title="View Detailed Breakdown"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {pay.receiptUrl && (
                        <button
                          onClick={() => setViewScreenshotUrl(pay.receiptUrl)}
                          className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs transition-colors border border-white/5"
                        >
                          Screenshot
                        </button>
                      )}
                      
                      {pay.status === "PAID" && (
                        <button
                          onClick={() => setSelectedPaymentForReceipt(pay)}
                          className="px-2 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg text-xs transition-colors border border-emerald-500/10"
                        >
                          Receipt
                        </button>
                      )}
                      
                      {pay.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(pay.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(pay.id)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(pay.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors inline-block"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Transactions Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">No payment transactions match the active search and filter criteria.</p>
        </div>
      )}

      {/* Record Fee Payment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-white">Record Fee Transaction</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex-shrink-0">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 -mr-1">
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-muted-foreground">Select Resident</label>
                  
                  {/* Searchable Custom Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-left text-white flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <span className="truncate">
                        {formData.studentId
                          ? students.find(s => s.id === formData.studentId)
                            ? `${students.find(s => s.id === formData.studentId).fullName} (${students.find(s => s.id === formData.studentId).room ? `Room ${students.find(s => s.id === formData.studentId).room.roomNumber}` : 'Unassigned'})`
                            : 'Choose resident...'
                          : 'Choose resident...'}
                      </span>
                      <span className="text-muted-foreground">↓</span>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-[#16161a] border border-white/5 rounded-xl shadow-2xl p-2 space-y-2 max-h-60 flex flex-col">
                        <input
                          type="text"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          placeholder="Search resident by name..."
                          className="w-full bg-[#121214] border border-white/5 rounded-lg py-2 px-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 flex-shrink-0"
                          autoFocus
                        />
                        <div className="overflow-y-auto flex-1 space-y-1">
                          {students.filter(stud => 
                            stud.fullName.toLowerCase().includes(dropdownSearch.toLowerCase())
                          ).length === 0 ? (
                            <div className="text-sm text-muted-foreground p-3 text-center">No residents found</div>
                          ) : (
                            students
                              .filter(stud => 
                                stud.fullName.toLowerCase().includes(dropdownSearch.toLowerCase())
                              )
                              .map(stud => (
                                <button
                                  key={stud.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, studentId: stud.id });
                                    setIsDropdownOpen(false);
                                    setDropdownSearch("");
                                  }}
                                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors flex justify-between items-center ${
                                    formData.studentId === stud.id
                                      ? 'bg-primary text-primary-foreground font-medium'
                                      : 'text-white hover:bg-white/5'
                                  }`}
                                >
                                  <span className="font-medium">{stud.fullName}</span>
                                  <span className={formData.studentId === stud.id ? 'text-primary-foreground/80' : 'text-xs text-muted-foreground'}>
                                    {stud.room ? `Room ${stud.room.roomNumber}` : 'Unassigned'}
                                  </span>
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Breakdown Inputs & Month selectors */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Hostel Rent (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.hostelFee}
                        onChange={(e) => setFormData({...formData, hostelFee: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Rent Month</label>
                      <select
                        value={formData.hostelFeeMonth}
                        onChange={(e) => setFormData({...formData, hostelFeeMonth: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Light Bill (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.lightBill}
                        onChange={(e) => setFormData({...formData, lightBill: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Light Month</label>
                      <select
                        value={formData.lightBillMonth}
                        onChange={(e) => setFormData({...formData, lightBillMonth: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Laundry (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.laundry}
                        onChange={(e) => setFormData({...formData, laundry: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Laundry Month</label>
                      <select
                        value={formData.laundryMonth}
                        onChange={(e) => setFormData({...formData, laundryMonth: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Balance Due (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.balanceFee}
                        onChange={(e) => setFormData({...formData, balanceFee: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Balance Month</label>
                      <select
                        value={formData.balanceFeeMonth}
                        onChange={(e) => setFormData({...formData, balanceFeeMonth: e.target.value})}
                        className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Calculated Total */}
                <div className="p-3 bg-[#16161a] rounded-xl border border-white/5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Calculated Grand Total:</span>
                  <span className="font-bold text-primary text-base">
                    ₹{((Number(formData.hostelFee)||0) + (Number(formData.lightBill)||0) + (Number(formData.laundry)||0) + (Number(formData.balanceFee)||0)).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 font-semibold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / QR Scanner">UPI / QR Scanner</option>
                      <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Transaction Date</label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Student Name / UPI Account Holder Name</label>
                  <input 
                    type="text"
                    value={formData.sendingAccountName}
                    onChange={(e) => setFormData({...formData, sendingAccountName: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">UTR / Transaction ID (Optional)</label>
                  <input 
                    type="text"
                    value={formData.utr}
                    onChange={(e) => setFormData({...formData, utr: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. 123456789012"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial Payment</option>
                    <option value="PENDING">Pending / Due</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-white/5 flex-shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Record Payment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Screenshot Modal */}
      <AnimatePresence>
        {viewScreenshotUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative max-w-3xl w-full max-h-[85vh] bg-[#121214] border border-white/10 rounded-3xl overflow-hidden p-6 flex flex-col items-center">
              <button 
                onClick={() => setViewScreenshotUrl(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:text-primary rounded-full transition-colors z-10"
              >
                <X size={24} />
              </button>
              <h4 className="text-lg font-bold text-white mb-4">Payment Screenshot</h4>
              <div className="flex-1 w-full overflow-auto flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={viewScreenshotUrl} 
                  alt="Receipt Screenshot" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedPaymentDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Payment Breakdown Details</h3>
                <button onClick={() => setSelectedPaymentDetails(null)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-white">
                <div>
                  <span className="text-xs text-muted-foreground uppercase block">Resident Name</span>
                  <span className="font-semibold">{selectedPaymentDetails.student?.fullName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase block">Sender Account Name</span>
                  <span className="font-semibold">{selectedPaymentDetails.sendingAccountName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase block">UTR / Transaction ID</span>
                  <code className="text-xs bg-white/5 px-2 py-0.5 rounded">{selectedPaymentDetails.utr || "N/A"}</code>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostel Rent {selectedPaymentDetails.hostelFeeMonth ? `(${selectedPaymentDetails.hostelFeeMonth})` : ""}:</span>
                    <span>₹{(selectedPaymentDetails.hostelFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Light Bill {selectedPaymentDetails.lightBillMonth ? `(${selectedPaymentDetails.lightBillMonth})` : ""}:</span>
                    <span>₹{(selectedPaymentDetails.lightBill ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Laundry {selectedPaymentDetails.laundryMonth ? `(${selectedPaymentDetails.laundryMonth})` : ""}:</span>
                    <span>₹{(selectedPaymentDetails.laundry ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance Due {selectedPaymentDetails.balanceFeeMonth ? `(${selectedPaymentDetails.balanceFeeMonth})` : ""}:</span>
                    <span>₹{(selectedPaymentDetails.balanceFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-primary text-base">
                    <span>Total Amount Paid:</span>
                    <span>₹{(selectedPaymentDetails.amount ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase block">Payment Mode</span>
                    <span className="font-semibold">{selectedPaymentDetails.paymentMode || "Online"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase block">Transaction Date</span>
                    <span className="font-semibold">
                      {new Date(selectedPaymentDetails.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex justify-end gap-2.5">
                  {selectedPaymentDetails.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedPaymentDetails.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Approve Payment
                      </button>
                      <button
                        onClick={() => handleReject(selectedPaymentDetails.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedPaymentDetails.status === "PAID" && (
                    <button
                      onClick={() => {
                        setSelectedPaymentForReceipt(selectedPaymentDetails);
                        setSelectedPaymentDetails(null);
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 transition-all"
                    >
                      View Print Receipt
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReceiptModal
        isOpen={!!selectedPaymentForReceipt}
        onClose={() => setSelectedPaymentForReceipt(null)}
        payment={selectedPaymentForReceipt}
      />
    </div>
  );
}
