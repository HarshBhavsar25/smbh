"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, BookOpen, Heart, FileText, Check, ArrowRight, ArrowLeft, 
  Loader2, Upload, AlertCircle, FileCheck, Eye
} from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const INPUT_CLASS =
  "w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm";

const LABEL_CLASS = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

const initialFormState = {
  // Student Info - Personal Details
  fullName: "",
  mobile: "",
  dob: "",
  gender: "",
  aadhaarNumber: "",
  panNumber: "",
  email: "",
  bloodGroup: "",
  photoUrl: "",

  // Student Info - Academic Details
  collegeName: "",
  course: "",
  year: "",
  rollNumber: "",
  academicYear: "",

  // Student Info - Hostel Details
  roomNumber: "",
  bedNumber: "",
  admissionDate: new Date().toISOString().split('T')[0],
  joiningDate: new Date().toISOString().split('T')[0],
  expectedStay: "1 Year",

  // Student Info - Documents
  aadhaarCardUrl: "",
  panCardUrl: "",
  collegeIdUrl: "",
  admissionReceiptUrl: "",

  // Parent / Guardian Info
  parentName: "",
  fatherName: "",
  motherName: "",
  parentOccupation: "",
  parentMobile: "",
  parentAltMobile: "",
  presentAddress: "",
  city: "",
  state: "",
  pinCode: "",
  parentAadhaar: "",
  parentPan: "",

  // Medical Info
  hasChronicIllness: false,
  illnessDescription: "",
  requiresUrgentAttention: "",
  allergies: "",
  familyDoctorName: "",
  familyDoctorContact: "",
  medicalBloodGroup: "",

  // Emergency Contact
  emergencyName: "",
  emergencyRelationship: "",
  emergencyMobile: "",
  emergencyAltMobile: "",

  // Hostel Agreement Checkboxes
  agreeHostelRules: false,
  agreeFeeTerms: false,
  agreeLockIn: false,
  agreeSecurityRefund: false,
  agreeDisciplinary: false,
  agreeDamageRecovery: false,
  agreeAlcoholProhibition: false,
  agreeEntryExitRules: false,
  studentSignatureUrl: "",
  agreementDate: new Date().toISOString().split('T')[0],
  agreementPlace: "",

  // Room Amenities
  amenityCeilingFan: false,
  amenityLocker: false,
  amenityBed: false,
  amenityMattress: false,
  amenityTubeLight: false,
  amenityWaterGeyser: false,
  existingDamageNotes: "",
  roomConditionRemarks: "",
  amenityConfirmation: false,
  amenityStudentSignatureUrl: "",
  amenityDate: new Date().toISOString().split('T')[0],

  // Parent Acknowledgement
  ackParentName: "",
  ackParentMobile: "",
  ackParentAddress: "",
  ackParentConfirmation: false,
  ackParentSignatureUrl: "",
  ackParentDate: new Date().toISOString().split('T')[0],
  ackParentPlace: "",
};

export default function FillApplicationFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    { number: 1, label: "Personal Info", icon: <User size={16} /> },
    { number: 2, label: "Academic & Hostel", icon: <BookOpen size={16} /> },
    { number: 3, label: "Guardian Info", icon: <User size={16} /> },
    { number: 4, label: "Medical & Emergency", icon: <Heart size={16} /> },
    { number: 5, label: "Undertaking Rules", icon: <FileText size={16} /> },
    { number: 6, label: "Amenities Handover", icon: <FileText size={16} /> },
    { number: 7, label: "Parent Ack", icon: <FileCheck size={16} /> }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
    const fData = new FormData();
    fData.append("file", file);

    try {
      const res = await fetch(`${API}/application-forms/upload`, {
        method: "POST",
        body: fData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setFormData(prev => ({ ...prev, [fieldName]: result.url }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.fullName || !formData.mobile || !formData.dob || !formData.gender || !formData.aadhaarNumber || !formData.email || !formData.photoUrl) {
        setError("Please fill in all required student personal fields and upload passport photo.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.collegeName || !formData.course || !formData.year || !formData.academicYear || !formData.roomNumber || !formData.aadhaarCardUrl || !formData.panCardUrl) {
        setError("Please fill academic/hostel fields and upload Aadhaar Card + PAN Card.");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.parentName || !formData.fatherName || !formData.motherName || !formData.parentOccupation || !formData.parentMobile || !formData.presentAddress || !formData.city || !formData.state || !formData.pinCode || !formData.parentAadhaar || !formData.parentPan) {
        setError("Please fill in all parent/guardian fields (Aadhaar & PAN are required).");
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.emergencyName || !formData.emergencyRelationship || !formData.emergencyMobile) {
        setError("Please fill in emergency contact details.");
        return;
      }
    } else if (currentStep === 5) {
      const rulesChecked = formData.agreeHostelRules && formData.agreeFeeTerms && formData.agreeLockIn && formData.agreeSecurityRefund && formData.agreeDisciplinary && formData.agreeDamageRecovery && formData.agreeAlcoholProhibition && formData.agreeEntryExitRules;
      if (!rulesChecked || !formData.studentSignatureUrl || !formData.agreementPlace) {
        setError("Please accept all undertaking rules, draw student signature, and enter place.");
        return;
      }
    } else if (currentStep === 6) {
      if (!formData.amenityConfirmation || !formData.amenityStudentSignatureUrl) {
        setError("Please check the confirmation box and sign the amenities handover.");
        return;
      }
    }

    setError("");
    setCurrentStep(prev => Math.min(prev + 1, 7));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setError("");
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ackParentConfirmation || !formData.ackParentSignatureUrl || !formData.ackParentName || !formData.ackParentMobile || !formData.ackParentAddress || !formData.ackParentPlace) {
      setError("Please fill parent acknowledgement details, sign, and accept confirmation.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/application-forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit application form");
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-6 border border-white/5"
        >
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Check size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your admission application form has been successfully filled and submitted. Our administrative desk will review the details and reach out to you shortly.
          </p>
          <div className="pt-4">
            <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 transition-all inline-block">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 md:px-8 selection:bg-primary/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Admission Application Form</h1>
          <p className="text-muted-foreground text-sm mt-2">Shree Mauli Boys Hostel — Online Admission & Room Handover Process</p>
        </div>

        {/* Stepper Header */}
        <div className="hidden md:flex justify-between items-center bg-[#121214] p-3 rounded-2xl border border-white/5">
          {steps.map(step => (
            <div 
              key={step.number} 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                currentStep === step.number 
                  ? "bg-primary/15 text-primary border border-primary/20" 
                  : currentStep > step.number
                  ? "text-emerald-400"
                  : "text-muted-foreground"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                currentStep === step.number
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.number
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/5 text-muted-foreground"
              }`}>
                {currentStep > step.number ? <Check size={12} /> : step.number}
              </div>
              <span className="text-xs font-semibold">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Mobile Stepper Header */}
        <div className="flex md:hidden justify-between items-center bg-[#121214] p-4 rounded-xl border border-white/5 text-sm">
          <span className="font-semibold text-white">Step {currentStep} of 7: {steps[currentStep-1].label}</span>
          <span className="text-xs text-muted-foreground">{Math.round((currentStep / 7) * 100)}% Complete</span>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2.5"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form Body Container */}
        <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/5 bg-[#121214]/60">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* STEP 1: Student Personal Details */}
            {currentStep === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Student Personal Information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Please provide your details exactly as per official documentation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Upload */}
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className={LABEL_CLASS}>Passport Size Photo *</label>
                    <div className="flex items-center gap-4 p-4 bg-[#16161a] border border-white/5 rounded-2xl">
                      <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                        {formData.photoUrl ? (
                          <img src={formData.photoUrl} alt="Passport photo" className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-white/20" size={24} />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input 
                          type="file" 
                          id="passport_photo" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "photoUrl")}
                          className="hidden" 
                        />
                        <label 
                          htmlFor="passport_photo" 
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold cursor-pointer border border-white/5 flex items-center gap-1.5 w-fit"
                        >
                          {uploadingFields.photoUrl ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          Upload Photo
                        </label>
                        <p className="text-[10px] text-muted-foreground">JPEG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Student Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Mobile Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="10 digit contact"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Date of Birth *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Gender *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={INPUT_CLASS}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Email ID *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="example@student.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Blood Group *</label>
                    <select
                      required
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className={INPUT_CLASS}
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Aadhaar Card Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="12 digit Aadhaar"
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>PAN Card Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="10 digit PAN"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Academic & Hostel Info */}
            {currentStep === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Academic, Hostel Details & Document Uploads</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Please provide your college details and select requested stay details.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Academic Details */}
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">College Details</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>College Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. COEP, Pune"
                      value={formData.collegeName}
                      onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Branch / Course *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. CSE / Mechanical"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Year *</label>
                    <select
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className={INPUT_CLASS}
                    >
                      <option value="">Select Year</option>
                      <option value="FY">First Year (FY)</option>
                      <option value="SY">Second Year (SY)</option>
                      <option value="TY">Third Year (TY)</option>
                      <option value="Final">Final Year</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Roll Number / Seat No</label>
                    <input 
                      type="text" 
                      placeholder="Enter Roll Number"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Academic Year *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 2026-2027"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  {/* Hostel Details */}
                  <div className="col-span-1 md:col-span-2 pt-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Hostel & Allocation Details</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Requested Room Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 101"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Requested Bed Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A"
                      value={formData.bedNumber}
                      onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Expected Joining Date *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Expected Stay Duration *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 1 Year / 6 Months"
                      value={formData.expectedStay}
                      onChange={(e) => setFormData({ ...formData, expectedStay: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  {/* Document Uploads */}
                  <div className="col-span-1 md:col-span-2 pt-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Document Scans & Uploads</h4>
                  </div>

                  {/* Aadhaar Upload */}
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Aadhaar Card Upload *</label>
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="aadhaar_upload" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "aadhaarCardUrl")}
                        className="hidden" 
                      />
                      <label 
                        htmlFor="aadhaar_upload"
                        className="flex-1 bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                      >
                        <span className="truncate">{formData.aadhaarCardUrl ? "Aadhaar Uploaded" : "Choose file..."}</span>
                        {uploadingFields.aadhaarCardUrl ? <Loader2 size={16} className="animate-spin text-primary" /> : <Upload size={16} />}
                      </label>
                      {formData.aadhaarCardUrl && (
                        <a href={formData.aadhaarCardUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/5 border border-white/5 rounded-xl text-primary hover:bg-white/10">
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* PAN Upload */}
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>PAN Card Upload *</label>
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="pan_upload" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "panCardUrl")}
                        className="hidden" 
                      />
                      <label 
                        htmlFor="pan_upload"
                        className="flex-1 bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                      >
                        <span className="truncate">{formData.panCardUrl ? "PAN Uploaded" : "Choose file..."}</span>
                        {uploadingFields.panCardUrl ? <Loader2 size={16} className="animate-spin text-primary" /> : <Upload size={16} />}
                      </label>
                      {formData.panCardUrl && (
                        <a href={formData.panCardUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/5 border border-white/5 rounded-xl text-primary hover:bg-white/10">
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* College ID Upload */}
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>College ID Card (Optional)</label>
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="college_id_upload" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "collegeIdUrl")}
                        className="hidden" 
                      />
                      <label 
                        htmlFor="college_id_upload"
                        className="flex-1 bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                      >
                        <span className="truncate">{formData.collegeIdUrl ? "ID Uploaded" : "Choose file..."}</span>
                        {uploadingFields.collegeIdUrl ? <Loader2 size={16} className="animate-spin text-primary" /> : <Upload size={16} />}
                      </label>
                      {formData.collegeIdUrl && (
                        <a href={formData.collegeIdUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/5 border border-white/5 rounded-xl text-primary hover:bg-white/10">
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admission Receipt Upload */}
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Admission Receipt (Optional)</label>
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="receipt_upload" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "admissionReceiptUrl")}
                        className="hidden" 
                      />
                      <label 
                        htmlFor="receipt_upload"
                        className="flex-1 bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                      >
                        <span className="truncate">{formData.admissionReceiptUrl ? "Receipt Uploaded" : "Choose file..."}</span>
                        {uploadingFields.admissionReceiptUrl ? <Loader2 size={16} className="animate-spin text-primary" /> : <Upload size={16} />}
                      </label>
                      {formData.admissionReceiptUrl && (
                        <a href={formData.admissionReceiptUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/5 border border-white/5 rounded-xl text-primary hover:bg-white/10">
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Parent & Guardian Details */}
            {currentStep === 3 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Parent / Guardian Information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Please provide contacts and identification details for your primary guardian.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Parent / Guardian Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Guardian Name"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Father's Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Father's Name"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Mother's Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Mother's Name"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Occupation *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Parent's Occupation"
                      value={formData.parentOccupation}
                      onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Mobile Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="10 digit mobile"
                      value={formData.parentMobile}
                      onChange={(e) => setFormData({ ...formData, parentMobile: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Alternate Mobile Number</label>
                    <input 
                      type="text" 
                      placeholder="Alternate contact"
                      value={formData.parentAltMobile}
                      onChange={(e) => setFormData({ ...formData, parentAltMobile: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className={LABEL_CLASS}>Present Address *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="House No, Street, Landmark"
                      value={formData.presentAddress}
                      onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>City *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="City Name"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>State *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>PIN Code *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="6 digit PIN Code"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Parent Aadhaar Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="12 digit Aadhaar"
                      value={formData.parentAadhaar}
                      onChange={(e) => setFormData({ ...formData, parentAadhaar: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Parent PAN Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="10 digit PAN"
                      value={formData.parentPan}
                      onChange={(e) => setFormData({ ...formData, parentPan: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Medical & Emergency Info */}
            {currentStep === 4 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Medical & Emergency Information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Safety is paramount. Please provide accurate health status and quick emergency contacts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Medical Details */}
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Medical Profile</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Any Chronic Illness? *</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                          type="radio" 
                          checked={formData.hasChronicIllness === true}
                          onChange={() => setFormData({ ...formData, hasChronicIllness: true })}
                          className="w-4 h-4 accent-primary" 
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                          type="radio" 
                          checked={formData.hasChronicIllness === false}
                          onChange={() => setFormData({ ...formData, hasChronicIllness: false, illnessDescription: "" })}
                          className="w-4 h-4 accent-primary" 
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Medical Blood Group *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Confirm Blood Group"
                      value={formData.medicalBloodGroup}
                      onChange={(e) => setFormData({ ...formData, medicalBloodGroup: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  {formData.hasChronicIllness && (
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                      <label className={LABEL_CLASS}>Chronic Illness Description *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Detail any medication or health issue"
                        value={formData.illnessDescription}
                        onChange={(e) => setFormData({ ...formData, illnessDescription: e.target.value })}
                        className={INPUT_CLASS} 
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Urgent Attention Problems (if any)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Asthma, Migraine, Epilepsy"
                      value={formData.requiresUrgentAttention}
                      onChange={(e) => setFormData({ ...formData, requiresUrgentAttention: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Allergies (if any)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Penicillin, Peanuts"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Family Doctor Name</label>
                    <input 
                      type="text" 
                      placeholder="Doctor Name"
                      value={formData.familyDoctorName}
                      onChange={(e) => setFormData({ ...formData, familyDoctorName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Family Doctor Contact No</label>
                    <input 
                      type="text" 
                      placeholder="Doctor Contact"
                      value={formData.familyDoctorContact}
                      onChange={(e) => setFormData({ ...formData, familyDoctorContact: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="col-span-1 md:col-span-2 pt-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Emergency Contact</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Emergency Contact Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contact Name"
                      value={formData.emergencyName}
                      onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Relationship *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Uncle / Brother"
                      value={formData.emergencyRelationship}
                      onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Mobile Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="10 digit mobile"
                      value={formData.emergencyMobile}
                      onChange={(e) => setFormData({ ...formData, emergencyMobile: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Alternate Mobile Number</label>
                    <input 
                      type="text" 
                      placeholder="Secondary contact"
                      value={formData.emergencyAltMobile}
                      onChange={(e) => setFormData({ ...formData, emergencyAltMobile: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Hostel Rules & Agreement */}
            {currentStep === 5 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Hostel Agreement & Undertaking</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Please review the rules carefully and sign the digital declaration.</p>
                </div>

                {/* Checklist of rules */}
                <div className="space-y-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl max-h-[300px] overflow-y-auto">
                  
                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeHostelRules}
                      onChange={(e) => setFormData({ ...formData, agreeHostelRules: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      1. I will strictly follow all rules and regulations laid down by the hostel administration.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeFeeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeFeeTerms: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      2. I agree to pay hostel rent, electricity bills, and other dues by the specified dates.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeLockIn}
                      onChange={(e) => setFormData({ ...formData, agreeLockIn: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      3. I understand that a minimum lock-in period applies, and premature departure forfeits terms.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeSecurityRefund}
                      onChange={(e) => setFormData({ ...formData, agreeSecurityRefund: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      4. Security deposit refunds will be processed only upon clearing all dues and during checkout.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeDisciplinary}
                      onChange={(e) => setFormData({ ...formData, agreeDisciplinary: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      5. Hostel management reserves the right to take disciplinary action or expel for misconduct.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeDamageRecovery}
                      onChange={(e) => setFormData({ ...formData, agreeDamageRecovery: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      6. Any damage caused to hostel property, furniture, or fittings will be recovered from me.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeAlcoholProhibition}
                      onChange={(e) => setFormData({ ...formData, agreeAlcoholProhibition: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      7. Smoking, consuming alcohol, drugs, or gambling inside the hostel is strictly prohibited.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group py-1">
                    <input 
                      type="checkbox" 
                      checked={formData.agreeEntryExitRules}
                      onChange={(e) => setFormData({ ...formData, agreeEntryExitRules: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                      8. I will strictly adhere to the curfew timings (entry/exit locks) prescribed by management.
                    </span>
                  </label>
                </div>

                {/* Digital Signature */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={LABEL_CLASS}>Student Digital Signature *</label>
                    <SignaturePad 
                      onChange={(base64) => setFormData({ ...formData, studentSignatureUrl: base64 || "" })}
                      value={formData.studentSignatureUrl}
                      placeholder="Use your finger/pointer to sign inside this box..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={LABEL_CLASS}>Date *</label>
                      <input 
                        type="date" 
                        required
                        value={formData.agreementDate}
                        onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                        className={INPUT_CLASS} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL_CLASS}>Place *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Pune"
                        value={formData.agreementPlace}
                        onChange={(e) => setFormData({ ...formData, agreementPlace: e.target.value })}
                        className={INPUT_CLASS} 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Room Amenities Handover */}
            {currentStep === 6 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Room Amenities Handover Form</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Please check all the functioning items handed over to you in your room.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Check Handed Items</h4>
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.amenityCeilingFan}
                      onChange={(e) => setFormData({ ...formData, amenityCeilingFan: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-medium text-white">Ceiling Fan</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.amenityLocker}
                      onChange={(e) => setFormData({ ...formData, amenityLocker: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-medium text-white">Individual Cupboard / Locker</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.amenityBed}
                      onChange={(e) => setFormData({ ...formData, amenityBed: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-medium text-white">Single Bed Frame</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.amenityMattress}
                      onChange={(e) => setFormData({ ...formData, amenityMattress: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-medium text-white">Cotton Mattress</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.amenityTubeLight}
                      onChange={(e) => setFormData({ ...formData, amenityTubeLight: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-medium text-white">Working Tube Light / LED</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-[#16161a] border border-white/5 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.amenityWaterGeyser}
                      onChange={(e) => setFormData({ ...formData, amenityWaterGeyser: e.target.checked })}
                      className="w-4 h-4 accent-primary" 
                    />
                    <span className="text-sm font-medium text-white">Water Geyser Access</span>
                  </label>

                  <div className="col-span-1 md:col-span-2 space-y-1.5 pt-4">
                    <label className={LABEL_CLASS}>Existing Damages / Notes (if any)</label>
                    <input 
                      type="text" 
                      placeholder="List any scratches, broken locks, etc."
                      value={formData.existingDamageNotes}
                      onChange={(e) => setFormData({ ...formData, existingDamageNotes: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className={LABEL_CLASS}>Room Condition Remarks</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Good / Clean / Needs painting"
                      value={formData.roomConditionRemarks}
                      onChange={(e) => setFormData({ ...formData, roomConditionRemarks: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-4">
                    <label className="flex items-start gap-3 cursor-pointer group py-2">
                      <input 
                        type="checkbox" 
                        checked={formData.amenityConfirmation}
                        onChange={(e) => setFormData({ ...formData, amenityConfirmation: e.target.checked })}
                        className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                      />
                      <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                        I confirm that the above checked amenities are physically present in my allocated room and in working order. I agree to return them in the same condition.
                      </span>
                    </label>
                  </div>

                  {/* Student Signature */}
                  <div className="col-span-1 md:col-span-2 space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className={LABEL_CLASS}>Student Signature (Handover confirmation) *</label>
                      <SignaturePad 
                        onChange={(base64) => setFormData({ ...formData, amenityStudentSignatureUrl: base64 || "" })}
                        value={formData.amenityStudentSignatureUrl}
                        placeholder="Draw your signature..."
                      />
                    </div>

                    <div className="space-y-1.5 max-w-xs">
                      <label className={LABEL_CLASS}>Handover Date *</label>
                      <input 
                        type="date" 
                        required
                        value={formData.amenityDate}
                        onChange={(e) => setFormData({ ...formData, amenityDate: e.target.value })}
                        className={INPUT_CLASS} 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 7: Parent Acknowledgement & Submit */}
            {currentStep === 7 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">Parent / Guardian Acknowledgement</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Final step. The primary parent or guardian must fill and sign this confirmation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Parent/Guardian Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Parent Name"
                      value={formData.ackParentName}
                      onChange={(e) => setFormData({ ...formData, ackParentName: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Parent Contact Mobile *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="10 digit contact"
                      value={formData.ackParentMobile}
                      onChange={(e) => setFormData({ ...formData, ackParentMobile: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className={LABEL_CLASS}>Permanent Address *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Full Residential Address"
                      value={formData.ackParentAddress}
                      onChange={(e) => setFormData({ ...formData, ackParentAddress: e.target.value })}
                      className={INPUT_CLASS} 
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group py-2">
                      <input 
                        type="checkbox" 
                        checked={formData.ackParentConfirmation}
                        onChange={(e) => setFormData({ ...formData, ackParentConfirmation: e.target.checked })}
                        className="w-4 h-4 accent-primary mt-0.5 shrink-0" 
                      />
                      <span className="text-xs text-muted-foreground group-hover:text-white transition-colors leading-relaxed">
                        I hereby declare that the details furnished by my ward are true to my knowledge. I accept responsibility for his conduct, timely payments of fees, and adherence to hostel discipline.
                      </span>
                    </label>
                  </div>

                  {/* Parent Signature */}
                  <div className="col-span-1 md:col-span-2 space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className={LABEL_CLASS}>Parent / Guardian Digital Signature *</label>
                      <SignaturePad 
                        onChange={(base64) => setFormData({ ...formData, ackParentSignatureUrl: base64 || "" })}
                        value={formData.ackParentSignatureUrl}
                        placeholder="Parent signs here..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={LABEL_CLASS}>Acknowledgement Date *</label>
                        <input 
                          type="date" 
                          required
                          value={formData.ackParentDate}
                          onChange={(e) => setFormData({ ...formData, ackParentDate: e.target.value })}
                          className={INPUT_CLASS} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={LABEL_CLASS}>Acknowledgement Place *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Pune"
                          value={formData.ackParentPlace}
                          onChange={(e) => setFormData({ ...formData, ackParentPlace: e.target.value })}
                          className={INPUT_CLASS} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6 border-t border-white/5">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm rounded-xl flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div /> // Spacer
              )}

              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold text-sm rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  Next Step <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 transition-all text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting Form...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              )}
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
