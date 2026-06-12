"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Search, Download, Trash2, Eye, X, Loader2, Calendar, 
  MapPin, Phone, Mail, Award, CheckCircle2, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchApplications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/application-forms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
    setIsDeleting(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/application-forms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(prev => prev.filter(app => app.id !== id));
        if (selectedApp?.id === id) setSelectedApp(null);
      } else {
        alert("Failed to delete application");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting application");
    } finally {
      setIsDeleting(null);
    }
  };

  const printApplication = (app: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Admission Form - ${app.fullName}</title>
          <style>
            @media print {
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; padding: 20px; font-size: 12px; line-height: 1.4; }
              .no-print { display: none; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: auto; line-height: 1.5; font-size: 13px; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .header-details h1 { font-size: 22px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-details p { margin: 3px 0 0 0; color: #555; font-size: 12px; }
            .photo-box { width: 110px; height: 130px; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fafafa; }
            .photo-box img { width: 100%; height: 100%; object-cover: cover; }
            .section-title { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 12px; text-transform: uppercase; border-left: 3px solid #000; margin: 15px 0 10px 0; letter-spacing: 0.5px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 10px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 20px; margin-bottom: 10px; }
            .field { margin-bottom: 4px; }
            .label { font-weight: 600; color: #555; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
            .value { border-bottom: 1px dotted #999; padding-bottom: 2px; font-size: 13px; color: #000; min-height: 16px; }
            .checkbox-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
            .checkbox-item { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; }
            .checkbox-item span { font-weight: bold; margin-right: 4px; }
            .signature-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; page-break-inside: avoid; }
            .signature-box { text-align: center; width: 200px; }
            .signature-img { width: 150px; height: 50px; object-fit: contain; border-bottom: 1px solid #000; margin-bottom: 4px; }
            .signature-label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-details">
              <h1>Shree Mauli Boys Hostel</h1>
              <p>299, Janawadi, Off Senapati Bapat Road, Pune – 411016</p>
              <p>Contact: +91 98819 03999 | Email: shreemauliboyshostel@gmail.com</p>
              <h2 style="font-size: 15px; font-weight: bold; margin-top: 10px; color: #000;">ADMISSION APPLICATION FORM</h2>
            </div>
            <div class="photo-box">
              ${app.photoUrl ? `<img src="${app.photoUrl}" alt="Photo" />` : `<span style="font-size: 10px; color: #888; text-align: center;">Affix Passport<br/>Photo</span>`}
            </div>
          </div>

          <div class="section-title">1. Student Personal Details</div>
          <div class="grid-2">
            <div class="field"><div class="label">Full Name</div><div class="value">${app.fullName || ""}</div></div>
            <div class="field"><div class="label">Mobile Number</div><div class="value">${app.mobile || ""}</div></div>
            <div class="field"><div class="label">Email ID</div><div class="value">${app.email || ""}</div></div>
            <div class="field"><div class="label">Date of Birth</div><div class="value">${app.dob || ""}</div></div>
            <div class="field"><div class="label">Gender</div><div class="value">${app.gender || ""}</div></div>
            <div class="field"><div class="label">Blood Group</div><div class="value">${app.bloodGroup || ""}</div></div>
            <div class="field"><div class="label">Aadhaar Number</div><div class="value">${app.aadhaarNumber || ""}</div></div>
            <div class="field"><div class="label">PAN Number</div><div class="value">${app.panNumber || "N/A"}</div></div>
          </div>

          <div class="section-title">2. Academic & Hostel Details</div>
          <div class="grid-2">
            <div class="field"><div class="label">College Name</div><div class="value">${app.collegeName || ""}</div></div>
            <div class="field"><div class="label">Branch / Course</div><div class="value">${app.course || ""}</div></div>
            <div class="field"><div class="label">Current Year</div><div class="value">${app.year || ""}</div></div>
            <div class="field"><div class="label">Roll Number</div><div class="value">${app.rollNumber || "N/A"}</div></div>
            <div class="field"><div class="label">Academic Year</div><div class="value">${app.academicYear || ""}</div></div>
            <div class="field"><div class="label">Expected Stay Duration</div><div class="value">${app.expectedStay || ""}</div></div>
            <div class="field"><div class="label">Room Requested</div><div class="value">Room ${app.roomNumber || ""}${app.bedNumber ? ` (Bed ${app.bedNumber})` : ""}</div></div>
            <div class="field"><div class="label">Admission/Joining Date</div><div class="value">${app.joiningDate || ""}</div></div>
          </div>

          <div class="section-title">3. Parent / Guardian Details</div>
          <div class="grid-2">
            <div class="field"><div class="label">Parent Name</div><div class="value">${app.parentName || ""}</div></div>
            <div class="field"><div class="label">Father's Name</div><div class="value">${app.fatherName || ""}</div></div>
            <div class="field"><div class="label">Mother's Name</div><div class="value">${app.motherName || ""}</div></div>
            <div class="field"><div class="label">Occupation</div><div class="value">${app.parentOccupation || ""}</div></div>
            <div class="field"><div class="label">Mobile Number</div><div class="value">${app.parentMobile || ""}</div></div>
            <div class="field"><div class="label">Alternate Contact</div><div class="value">${app.parentAltMobile || "N/A"}</div></div>
            <div class="field"><div class="label">Parent Aadhaar</div><div class="value">${app.parentAadhaar || ""}</div></div>
            <div class="field"><div class="label">Parent PAN</div><div class="value">${app.parentPan || ""}</div></div>
          </div>
          <div class="field" style="margin-top: 10px;">
            <div class="label">Present Address</div>
            <div class="value">${app.presentAddress || ""}, ${app.city || ""}, ${app.state || ""} - ${app.pinCode || ""}</div>
          </div>

          <div class="page-break"></div>

          <div class="section-title" style="margin-top:0;">4. Medical Details & Emergency Contacts</div>
          <div class="grid-2">
            <div class="field"><div class="label">Chronic Illness?</div><div class="value">${app.hasChronicIllness ? "Yes - " + app.illnessDescription : "No"}</div></div>
            <div class="field"><div class="label">Urgent Attention Info</div><div class="value">${app.requiresUrgentAttention || "None"}</div></div>
            <div class="field"><div class="label">Allergies</div><div class="value">${app.allergies || "None"}</div></div>
            <div class="field"><div class="label">Family Doctor Name</div><div class="value">${app.familyDoctorName || "N/A"}</div></div>
            <div class="field"><div class="label">Family Doctor Contact</div><div class="value">${app.familyDoctorContact || "N/A"}</div></div>
            <div class="field"><div class="label">Blood Group Check</div><div class="value">${app.medicalBloodGroup || ""}</div></div>
          </div>

          <h3 style="font-size:11px; text-transform:uppercase; margin-top:15px; border-bottom:1px solid #ddd; padding-bottom:3px;">Emergency Contact Person</h3>
          <div class="grid-2">
            <div class="field"><div class="label">Contact Name</div><div class="value">${app.emergencyName || ""}</div></div>
            <div class="field"><div class="label">Relationship</div><div class="value">${app.emergencyRelationship || ""}</div></div>
            <div class="field"><div class="label">Contact Mobile</div><div class="value">${app.emergencyMobile || ""}</div></div>
            <div class="field"><div class="label">Alternate Mobile</div><div class="value">${app.emergencyAltMobile || "N/A"}</div></div>
          </div>

          <div class="section-title">5. Hostel Agreement & Undertaking Rules Accepted</div>
          <div style="font-size: 11px; color: #444; line-height: 1.5; margin-bottom: 10px;">
            Student has explicitly read and accepted the following rules online:
          </div>
          <div class="checkbox-list">
            <div class="checkbox-item"><span>[✓]</span> Strict compliance to hostel rules.</div>
            <div class="checkbox-item"><span>[✓]</span> Timely payment of rent & light bills.</div>
            <div class="checkbox-item"><span>[✓]</span> Minimum lock-in period adherence.</div>
            <div class="checkbox-item"><span>[✓]</span> Refund processed post clearances.</div>
            <div class="checkbox-item"><span>[✓]</span> Right of expulsion for misconduct.</div>
            <div class="checkbox-item"><span>[✓]</span> Liability for any physical room damages.</div>
            <div class="checkbox-item"><span>[✓]</span> Zero tolerance on alcohol & smoking.</div>
            <div class="checkbox-item"><span>[✓]</span> Strictly following entry/exit lock times.</div>
          </div>

          <div class="signature-container">
            <div>
              <p><strong>Place:</strong> ${app.agreementPlace}</p>
              <p><strong>Date:</strong> ${app.agreementDate}</p>
            </div>
            <div class="signature-box">
              ${app.studentSignatureUrl ? `<img src="${app.studentSignatureUrl}" class="signature-img" />` : `<div style="height:50px;"></div>`}
              <div class="signature-label">Student Signature</div>
            </div>
          </div>

          <div class="page-break"></div>

          <div class="section-title" style="margin-top:0;">6. Room Amenities Handover Form</div>
          <div style="font-size: 11px; color: #444; line-height: 1.5; margin-bottom: 10px;">
            Physically verified and confirmed inventory list in Room ${app.roomNumber}:
          </div>
          <div class="checkbox-list">
            <div class="checkbox-item"><span>[${app.amenityCeilingFan ? "✓" : " "}]</span> Ceiling Fan</div>
            <div class="checkbox-item"><span>[${app.amenityLocker ? "✓" : " "}]</span> Locker / Cupboard</div>
            <div class="checkbox-item"><span>[${app.amenityBed ? "✓" : " "}]</span> Bed Frame</div>
            <div class="checkbox-item"><span>[${app.amenityMattress ? "✓" : " "}]</span> Mattress</div>
            <div class="checkbox-item"><span>[${app.amenityTubeLight ? "✓" : " "}]</span> Tube Light / LED</div>
            <div class="checkbox-item"><span>[${app.amenityWaterGeyser ? "✓" : " "}]</span> Water Geyser Access</div>
          </div>
          
          <div class="grid-2" style="margin-top: 15px;">
            <div class="field"><div class="label">Existing Damages Notes</div><div class="value">${app.existingDamageNotes || "None"}</div></div>
            <div class="field"><div class="label">Room Condition Remarks</div><div class="value">${app.roomConditionRemarks || "Good Condition"}</div></div>
          </div>

          <div class="signature-container">
            <div>
              <p><strong>Handover Date:</strong> ${app.amenityDate}</p>
            </div>
            <div class="signature-box">
              ${app.amenityStudentSignatureUrl ? `<img src="${app.amenityStudentSignatureUrl}" class="signature-img" />` : `<div style="height:50px;"></div>`}
              <div class="signature-label">Student Confirmation Signature</div>
            </div>
          </div>

          <div class="section-title">7. Parent / Guardian Acknowledgement</div>
          <div style="font-size: 11px; color: #444; line-height: 1.5; margin-bottom: 10px;">
            I hereby declare that the details furnished by my ward are true. I take responsibility of his conduct, fee payments, and compliance.
          </div>
          <div class="grid-2">
            <div class="field"><div class="label">Parent Name</div><div class="value">${app.ackParentName || app.parentName || ""}</div></div>
            <div class="field"><div class="label">Contact Mobile</div><div class="value">${app.ackParentMobile || app.parentMobile || ""}</div></div>
          </div>
          <div class="field" style="margin-top: 5px;">
            <div class="label">Permanent Address</div>
            <div class="value">${app.ackParentAddress || app.presentAddress || ""}</div>
          </div>

          <div class="signature-container" style="margin-top: 20px;">
            <div>
              <p><strong>Place:</strong> ${app.ackParentPlace}</p>
              <p><strong>Date:</strong> ${app.ackParentDate}</p>
            </div>
            <div class="signature-box">
              ${app.ackParentSignatureUrl ? `<img src="${app.ackParentSignatureUrl}" class="signature-img" />` : `<div style="height:50px;"></div>`}
              <div class="signature-label">Parent / Guardian Signature</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredApps = applications.filter(app => 
    app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-primary" /> Online Applications
          </h1>
          <p className="text-sm text-muted-foreground">List of incoming admission applications filled by prospective residents</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Search by name, college, room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121214] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder:text-muted-foreground"
        />
      </div>

      {/* List Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-white/5">
          <p className="text-muted-foreground text-sm">No applications found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#121214]/40">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-6">Applicant Name</th>
                <th className="py-4 px-6">College & Course</th>
                <th className="py-4 px-6">Requested Room</th>
                <th className="py-4 px-6">Mobile</th>
                <th className="py-4 px-6">Submitted At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        {app.photoUrl ? (
                          <img src={app.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                            {app.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{app.fullName}</span>
                        <span className="text-[10px] text-muted-foreground">{app.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white block">{app.collegeName}</span>
                    <span className="text-[11px] text-muted-foreground">{app.course} ({app.year})</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white">Room {app.roomNumber}</span>
                    {app.bedNumber && <span className="text-xs text-muted-foreground block">Bed {app.bedNumber}</span>}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">{app.mobile}</td>
                  <td className="py-4 px-6 text-muted-foreground text-xs">
                    {new Date(app.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </td>
                  <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => printApplication(app)}
                      className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors border border-primary/10"
                      title="Print / PDF"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(app.id)}
                      disabled={isDeleting === app.id}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/10"
                      title="Delete"
                    >
                      {isDeleting === app.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL (SIDEBAR DRAWER STYLE) */}
      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.6 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0f0f12] border-l border-white/5 z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#121214]">
                <div>
                  <h2 className="text-lg font-bold text-white">Application Details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Submitted by {selectedApp.fullName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => printApplication(selectedApp)}
                    className="p-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Download size={14} /> Print
                  </button>
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded-lg border border-white/5"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                
                {/* Profile Overview */}
                <div className="flex items-center gap-5 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                    {selectedApp.photoUrl ? (
                      <img src={selectedApp.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl font-bold">
                        {selectedApp.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedApp.fullName}</h3>
                    <p className="text-sm text-primary font-medium">{selectedApp.collegeName} • {selectedApp.course}</p>
                    <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(selectedApp.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Section 1: Personal Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">1. Student Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-[#121214] rounded-2xl border border-white/5">
                    <div>
                      <span className="text-xs text-muted-foreground block">Mobile Number</span>
                      <span className="text-white font-medium">{selectedApp.mobile}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Email ID</span>
                      <span className="text-white font-medium">{selectedApp.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Date of Birth</span>
                      <span className="text-white font-medium">{selectedApp.dob}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Gender</span>
                      <span className="text-white font-medium">{selectedApp.gender}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Aadhaar Card No</span>
                      <span className="text-white font-medium">{selectedApp.aadhaarNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">PAN Number</span>
                      <span className="text-white font-medium">{selectedApp.panNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Blood Group</span>
                      <span className="text-white font-medium">{selectedApp.bloodGroup}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Stay Duration</span>
                      <span className="text-white font-medium">{selectedApp.expectedStay}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Hostel details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">2. Allocated Room & Dates</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-[#121214] rounded-2xl border border-white/5">
                    <div>
                      <span className="text-xs text-muted-foreground block">Requested Room</span>
                      <span className="text-white font-medium">Room {selectedApp.roomNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Requested Bed</span>
                      <span className="text-white font-medium">Bed {selectedApp.bedNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Joining Date</span>
                      <span className="text-white font-medium">{selectedApp.joiningDate}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Admission Date</span>
                      <span className="text-white font-medium">{selectedApp.admissionDate}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Parent details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">3. Parent / Guardian Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-[#121214] rounded-2xl border border-white/5">
                    <div>
                      <span className="text-xs text-muted-foreground block">Guardian Name</span>
                      <span className="text-white font-medium">{selectedApp.parentName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Occupation</span>
                      <span className="text-white font-medium">{selectedApp.parentOccupation}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Mobile Number</span>
                      <span className="text-white font-medium">{selectedApp.parentMobile}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Alternate Mobile</span>
                      <span className="text-white font-medium">{selectedApp.parentAltMobile || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Parent Aadhaar No</span>
                      <span className="text-white font-medium">{selectedApp.parentAadhaar}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Parent PAN No</span>
                      <span className="text-white font-medium">{selectedApp.parentPan}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block">Present Address</span>
                      <span className="text-white font-medium">{selectedApp.presentAddress}, {selectedApp.city}, {selectedApp.state} - {selectedApp.pinCode}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Medical Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">4. Medical & Emergency Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-[#121214] rounded-2xl border border-white/5">
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block">Chronic Illness?</span>
                      <span className="text-white font-medium">{selectedApp.hasChronicIllness ? `Yes - ${selectedApp.illnessDescription}` : "No"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Urgent Action Issues</span>
                      <span className="text-white font-medium">{selectedApp.requiresUrgentAttention || "None"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Allergies</span>
                      <span className="text-white font-medium">{selectedApp.allergies || "None"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Family Doctor</span>
                      <span className="text-white font-medium">{selectedApp.familyDoctorName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Doctor Contact</span>
                      <span className="text-white font-medium">{selectedApp.familyDoctorContact || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Emergency Contact Person</span>
                      <span className="text-white font-medium">{selectedApp.emergencyName} ({selectedApp.emergencyRelationship})</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Emergency Mobile</span>
                      <span className="text-white font-medium">{selectedApp.emergencyMobile}</span>
                    </div>
                  </div>
                </div>

                {/* Document scans */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">5. Document Scans</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedApp.aadhaarCardUrl && (
                      <a 
                        href={selectedApp.aadhaarCardUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-4 bg-[#121214] border border-white/5 hover:border-primary/20 rounded-2xl flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-white">Aadhaar Card Scan</span>
                        <Download size={16} className="text-primary" />
                      </a>
                    )}
                    {selectedApp.panCardUrl && (
                      <a 
                        href={selectedApp.panCardUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-4 bg-[#121214] border border-white/5 hover:border-primary/20 rounded-2xl flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-white">PAN Card Scan</span>
                        <Download size={16} className="text-primary" />
                      </a>
                    )}
                    {selectedApp.collegeIdUrl && (
                      <a 
                        href={selectedApp.collegeIdUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-4 bg-[#121214] border border-white/5 hover:border-primary/20 rounded-2xl flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-white">College ID Scan</span>
                        <Download size={16} className="text-primary" />
                      </a>
                    )}
                    {selectedApp.admissionReceiptUrl && (
                      <a 
                        href={selectedApp.admissionReceiptUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-4 bg-[#121214] border border-white/5 hover:border-primary/20 rounded-2xl flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-white">Admission Receipt</span>
                        <Download size={16} className="text-primary" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Room inventory handover */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">6. Room Amenities verification</h4>
                  <div className="p-4 bg-[#121214] border border-white/5 rounded-2xl space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedApp.amenityCeilingFan ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <span className="text-white">Ceiling Fan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedApp.amenityLocker ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <span className="text-white">Locker</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedApp.amenityBed ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <span className="text-white">Bed Frame</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedApp.amenityMattress ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <span className="text-white">Mattress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedApp.amenityTubeLight ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <span className="text-white">Tube Light</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedApp.amenityWaterGeyser ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <span className="text-white">Water Geyser Access</span>
                      </div>
                    </div>
                    {selectedApp.existingDamageNotes && (
                      <div className="border-t border-white/5 pt-3">
                        <span className="text-xs text-muted-foreground block">Damages Notes</span>
                        <span className="text-white">{selectedApp.existingDamageNotes}</span>
                      </div>
                    )}
                    {selectedApp.roomConditionRemarks && (
                      <div className="pt-1">
                        <span className="text-xs text-muted-foreground block">Condition Remarks</span>
                        <span className="text-white">{selectedApp.roomConditionRemarks}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Digital Signatures */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">7. Digital Signatures Captured</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Student Sign */}
                    {selectedApp.studentSignatureUrl && (
                      <div className="p-4 bg-[#121214] border border-white/5 rounded-2xl text-center space-y-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">Student Signature</span>
                        <div className="h-16 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center p-2">
                          <img src={selectedApp.studentSignatureUrl} alt="Student Signature" className="max-h-full object-contain filter invert" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Date: {selectedApp.agreementDate}</span>
                      </div>
                    )}
                    {/* Parent Sign */}
                    {selectedApp.ackParentSignatureUrl && (
                      <div className="p-4 bg-[#121214] border border-white/5 rounded-2xl text-center space-y-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">Parent Signature</span>
                        <div className="h-16 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center p-2">
                          <img src={selectedApp.ackParentSignatureUrl} alt="Parent Signature" className="max-h-full object-contain filter invert" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Date: {selectedApp.ackParentDate}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
