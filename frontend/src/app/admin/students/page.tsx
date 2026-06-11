"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, Search, Edit2, Trash2, DoorClosed, 
  Phone, Mail, BookOpen, MapPin, X, Check, Loader2, CreditCard, Save, Eye
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const INPUT_CLASS =
  "w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all";

const emptyStudent = {
  email: "",
  password: "",
  fullName: "",
  mobile: "",
  collegeName: "",
  course: "",
  parentName: "",
  parentContact: "",
  address: "",
  dob: "",
  bloodGroup: "",
  academicYear: "CURRENT",
  guardianName2: "",
  guardianContact2: "",
  vehicleNo: "",
  roomId: "",
  locationInRoom: "",
  yearOfStudy: "1st",
  yearOfStudyOther: "",
  securityDeposit: "",
  refundAmount: "",
  hasLeft: false,
};

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Form states
  const [newStudent, setNewStudent] = useState(emptyStudent);
  const [editForm, setEditForm] = useState({
    fullName: "",
    mobile: "",
    collegeName: "",
    course: "",
    parentName: "",
    parentContact: "",
    address: "",
    email: "",
    newPassword: "",
    dob: "",
    bloodGroup: "",
    academicYear: "CURRENT",
    guardianName2: "",
    guardianContact2: "",
    vehicleNo: "",
    roomId: "",
    locationInRoom: "",
    yearOfStudy: "1st",
    yearOfStudyOther: "",
    securityDeposit: "",
    refundAmount: "",
    hasLeft: false,
  });

  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedLocationInRoom, setSelectedLocationInRoom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [studentRes, roomRes] = await Promise.all([
        fetch(`${API}/students`, { headers }),
        fetch(`${API}/rooms`, { headers }),
      ]);
      const studentData = await studentRes.json();
      const roomData = await roomRes.json();
      if (Array.isArray(studentData)) setStudents(studentData);
      if (Array.isArray(roomData)) setRooms(roomData);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Add Student ---------- */
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStudent, role: "STUDENT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create student");
      setIsAddModalOpen(false);
      setNewStudent(emptyStudent);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Edit Student ---------- */
  const openEditModal = (student: any) => {
    setSelectedStudent(student);
    setEditForm({
      fullName: student.fullName || "",
      mobile: student.mobile || "",
      collegeName: student.collegeName || "",
      course: student.course || "",
      parentName: student.parentName || "",
      parentContact: student.parentContact || "",
      address: student.address || "",
      email: student.user?.email || "",
      newPassword: "",
      dob: student.dob || "",
      bloodGroup: student.bloodGroup || "",
      academicYear: student.academicYear || "CURRENT",
      guardianName2: student.guardianName2 || "",
      guardianContact2: student.guardianContact2 || "",
      vehicleNo: student.vehicleNo || "",
      roomId: student.roomId || "",
      locationInRoom: student.locationInRoom || "",
      yearOfStudy: student.yearOfStudy || "1st",
      yearOfStudyOther: student.yearOfStudyOther || "",
      securityDeposit: student.securityDeposit !== undefined ? String(student.securityDeposit) : "",
      refundAmount: student.refundAmount !== undefined ? String(student.refundAmount) : "",
      hasLeft: student.hasLeft || false,
    });
    setError("");
    setIsEditModalOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      // Build payload — only include password if admin entered one
      const payload: any = {
        fullName: editForm.fullName,
        mobile: editForm.mobile,
        collegeName: editForm.collegeName,
        course: editForm.course,
        parentName: editForm.parentName,
        parentContact: editForm.parentContact,
        address: editForm.address,
        email: editForm.email,
        dob: editForm.dob,
        bloodGroup: editForm.bloodGroup,
        academicYear: editForm.academicYear,
        guardianName2: editForm.guardianName2,
        guardianContact2: editForm.guardianContact2,
        vehicleNo: editForm.vehicleNo,
        roomId: editForm.roomId || null,
        locationInRoom: editForm.locationInRoom || null,
        yearOfStudy: editForm.yearOfStudy,
        yearOfStudyOther: editForm.yearOfStudyOther,
        securityDeposit: Number(editForm.securityDeposit) || 0,
        refundAmount: Number(editForm.refundAmount) || 0,
        hasLeft: editForm.hasLeft,
      };
      if (editForm.newPassword.trim()) {
        payload.password = editForm.newPassword;
      }
      const res = await fetch(`${API}/students/${selectedStudent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update student details");
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- View Details ---------- */
  const openViewModal = (student: any) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  /* ---------- Assign Room ---------- */
  const handleAssignRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/students/${selectedStudent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoomId || null,
          locationInRoom: selectedLocationInRoom || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign room");
      setIsAssignModalOpen(false);
      setSelectedStudent(null);
      setSelectedRoomId("");
      setSelectedLocationInRoom("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Delete ---------- */
  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.collegeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room?.roomNumber?.includes(searchTerm)
  );

  /* ===================== RENDER ===================== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Directory</h1>
          <p className="text-muted-foreground">Manage resident profiles, room assignments, and contact details.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <UserPlus size={18} /> Add New Student
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search by name, college, or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#121214] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="p-6">Name</th>
                  <th className="p-6">Contact</th>
                  <th className="p-6">College / Course</th>
                  <th className="p-6">Room</th>
                  <th className="p-6">Fee Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div className="font-semibold text-white">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{student.user?.email}</div>
                    </td>
                    <td className="p-6 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Phone size={12} className="text-primary" /> {student.mobile}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Users size={12} className="text-accent" /> Parent: {student.parentContact}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-white font-medium">{student.collegeName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{student.course}</div>
                    </td>
                    <td className="p-6">
                      {student.room ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
                          <DoorClosed size={12} /> Room {student.room.roomNumber}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setSelectedRoomId("");
                            setIsAssignModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
                        >
                          <DoorClosed size={12} /> Unassigned
                        </button>
                      )}
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        student.feeStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : student.feeStatus === "PARTIAL"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        <CreditCard size={12} /> {student.feeStatus}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details */}
                        <button
                          title="View Details"
                          onClick={() => openViewModal(student)}
                          className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        {/* Edit Details */}
                        <button
                          title="Edit Details"
                          onClick={() => openEditModal(student)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {/* Assign Room */}
                        <button
                          title="Assign Room"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSelectedRoomId(student.roomId || "");
                            setSelectedLocationInRoom(student.locationInRoom || "");
                            setIsAssignModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        >
                          <DoorClosed size={16} />
                        </button>
                        {/* Delete */}
                        <button
                          title="Delete Student"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <p className="text-muted-foreground font-medium">No students found matching your criteria.</p>
        </div>
      )}

      {/* ===== MODAL: Add Student ===== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#121214] border border-white/5 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl md:text-2xl font-bold text-white">Add New Student</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              {error && <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex-shrink-0">{error}</div>}
              <form onSubmit={handleAddStudent} className="space-y-6 overflow-y-auto flex-1 pr-1 -mr-1">
                
                {/* Personal details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newStudent.fullName}
                        onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <input
                        type="date"
                        value={newStudent.dob}
                        onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Mobile Number *</label>
                      <input
                        type="text"
                        required
                        value={newStudent.mobile}
                        onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                      <select
                        value={newStudent.bloodGroup}
                        onChange={(e) => setNewStudent({ ...newStudent, bloodGroup: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="">Select Blood Group</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Vehicle Number (Optional)</label>
                      <input
                        type="text"
                        value={newStudent.vehicleNo}
                        onChange={(e) => setNewStudent({ ...newStudent, vehicleNo: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="MH-12-XX-XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Academic Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">College Name *</label>
                      <input
                        type="text"
                        required
                        value={newStudent.collegeName}
                        onChange={(e) => setNewStudent({ ...newStudent, collegeName: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="COEP, Pune"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Course / Branch *</label>
                      <input
                        type="text"
                        required
                        value={newStudent.course}
                        onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="B.Tech Computer Science"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Year of Study</label>
                      <select
                        value={newStudent.yearOfStudy}
                        onChange={(e) => setNewStudent({ ...newStudent, yearOfStudy: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        {["1st", "2nd", "3rd", "4th", "MBA", "MCA", "BCA", "Other"].map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                    {newStudent.yearOfStudy === "Other" && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Specify Year of Study *</label>
                        <input
                          type="text"
                          required
                          value={newStudent.yearOfStudyOther}
                          onChange={(e) => setNewStudent({ ...newStudent, yearOfStudyOther: e.target.value })}
                          className={INPUT_CLASS}
                          placeholder="e.g. M.Tech, PhD"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Academic Year Status</label>
                      <select
                        value={newStudent.academicYear}
                        onChange={(e) => setNewStudent({ ...newStudent, academicYear: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="CURRENT">Current Academic Year</option>
                        <option value="PREVIOUS">Previous Academic Year</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Room Assignment & Fees */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Room Assignment & Fees</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Room</label>
                      <select
                        value={newStudent.roomId}
                        onChange={(e) => setNewStudent({ ...newStudent, roomId: e.target.value, locationInRoom: "" })}
                        className={INPUT_CLASS}
                      >
                        <option value="">No Room (Unassigned)</option>
                        {rooms.map(room => {
                          const occ = room.students?.length || 0;
                          return (
                            <option key={room.id} value={room.id} disabled={occ >= room.capacity}>
                              Room {room.roomNumber} ({room.type.replace("_", " ")}) — {occ}/{room.capacity} occupied
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Location in Room</label>
                      <select
                        value={newStudent.locationInRoom}
                        onChange={(e) => setNewStudent({ ...newStudent, locationInRoom: e.target.value })}
                        className={INPUT_CLASS}
                        disabled={!newStudent.roomId}
                      >
                        <option value="">Select Location</option>
                        {newStudent.roomId && (rooms.find(r => r.id === newStudent.roomId)?.locations || []).map((loc: string) => {
                          const isOccupied = rooms.find(r => r.id === newStudent.roomId)?.students?.some((s: any) => s.locationInRoom === loc);
                          return (
                            <option key={loc} value={loc} disabled={isOccupied}>
                              {loc} {isOccupied ? "(Occupied)" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {!newStudent.roomId && (
                        <p className="text-[11px] text-muted-foreground/60 italic mt-1">Assign a room first to select a location.</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={newStudent.securityDeposit}
                        onChange={(e) => setNewStudent({ ...newStudent, securityDeposit: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="e.g. 5000"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Guardian Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Parent / Guardian Name *</label>
                      <input
                        type="text"
                        required
                        value={newStudent.parentName}
                        onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="Robert Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Parent Contact *</label>
                      <input
                        type="text"
                        required
                        value={newStudent.parentContact}
                        onChange={(e) => setNewStudent({ ...newStudent, parentContact: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="+91 98765 43211"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Guardian Name 2 (Secondary)</label>
                      <input
                        type="text"
                        value={newStudent.guardianName2}
                        onChange={(e) => setNewStudent({ ...newStudent, guardianName2: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="e.g. Uncle / Brother"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Guardian Contact 2 (Secondary)</label>
                      <input
                        type="text"
                        value={newStudent.guardianContact2}
                        onChange={(e) => setNewStudent({ ...newStudent, guardianContact2: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="+91 98765 43212"
                      />
                    </div>
                  </div>
                </div>

                {/* Home address */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Home Address</h4>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Home Address *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      className={INPUT_CLASS}
                      placeholder="Full Address"
                    />
                  </div>
                </div>

                {/* Login credentials */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Login Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Login Password *</label>
                      <input
                        type="password"
                        required
                        value={newStudent.password}
                        onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 flex-shrink-0">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Create Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: Edit Student ===== */}
      <AnimatePresence>
        {isEditModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#121214] border border-white/5 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Edit Student Details</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedStudent.user?.email}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              {error && <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex-shrink-0">{error}</div>}
              <form onSubmit={handleEditStudent} className="space-y-6 overflow-y-auto flex-1 pr-1 -mr-1">
                
                {/* Personal details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Mobile Number *</label>
                      <input
                        type="text"
                        required
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                      <select
                        value={editForm.bloodGroup}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="">Select Blood Group</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Vehicle Number (Optional)</label>
                      <input
                        type="text"
                        value={editForm.vehicleNo}
                        onChange={(e) => setEditForm({ ...editForm, vehicleNo: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="MH-12-XX-XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Academic Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">College Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.collegeName}
                        onChange={(e) => setEditForm({ ...editForm, collegeName: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="COEP, Pune"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Course / Branch *</label>
                      <input
                        type="text"
                        required
                        value={editForm.course}
                        onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="B.Tech Computer Science"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Year of Study</label>
                      <select
                        value={editForm.yearOfStudy}
                        onChange={(e) => setEditForm({ ...editForm, yearOfStudy: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        {["1st", "2nd", "3rd", "4th", "MBA", "MCA", "BCA", "Other"].map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                    {editForm.yearOfStudy === "Other" && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Specify Year of Study *</label>
                        <input
                          type="text"
                          required
                          value={editForm.yearOfStudyOther}
                          onChange={(e) => setEditForm({ ...editForm, yearOfStudyOther: e.target.value })}
                          className={INPUT_CLASS}
                          placeholder="e.g. M.Tech, PhD"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Academic Year Status</label>
                      <select
                        value={editForm.academicYear}
                        onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="CURRENT">Current Academic Year</option>
                        <option value="PREVIOUS">Previous Academic Year</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Room Assignment & Location */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Room & Location Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Room</label>
                      <select
                        value={editForm.roomId}
                        onChange={(e) => setEditForm({ ...editForm, roomId: e.target.value, locationInRoom: "" })}
                        className={INPUT_CLASS}
                      >
                        <option value="">No Room (Unassigned)</option>
                        {rooms.map(room => {
                          const occ = room.students?.length || 0;
                          return (
                            <option key={room.id} value={room.id} disabled={occ >= room.capacity && room.id !== selectedStudent.roomId}>
                              Room {room.roomNumber} ({room.type.replace("_", " ")}) — {occ}/{room.capacity} occupied
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Location in Room</label>
                      <select
                        value={editForm.locationInRoom}
                        onChange={(e) => setEditForm({ ...editForm, locationInRoom: e.target.value })}
                        className={INPUT_CLASS}
                        disabled={!editForm.roomId}
                      >
                        <option value="">Select Location</option>
                        {editForm.roomId && (rooms.find(r => r.id === editForm.roomId)?.locations || []).map((loc: string) => {
                          const isOccupied = rooms.find(r => r.id === editForm.roomId)?.students?.some((s: any) => s.locationInRoom === loc && s.id !== selectedStudent.id);
                          return (
                            <option key={loc} value={loc} disabled={isOccupied}>
                              {loc} {isOccupied ? "(Occupied)" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {!editForm.roomId && (
                        <p className="text-[11px] text-muted-foreground/60 italic mt-1">Assign a room first to select a location.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guardian details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Guardian Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Parent / Guardian Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.parentName}
                        onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="Robert Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Parent Contact *</label>
                      <input
                        type="text"
                        required
                        value={editForm.parentContact}
                        onChange={(e) => setEditForm({ ...editForm, parentContact: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="+91 98765 43211"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Guardian Name 2 (Secondary)</label>
                      <input
                        type="text"
                        value={editForm.guardianName2}
                        onChange={(e) => setEditForm({ ...editForm, guardianName2: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="e.g. Uncle / Brother"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Guardian Contact 2 (Secondary)</label>
                      <input
                        type="text"
                        value={editForm.guardianContact2}
                        onChange={(e) => setEditForm({ ...editForm, guardianContact2: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="+91 98765 43212"
                      />
                    </div>
                  </div>
                </div>

                {/* Home address */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Home Address</h4>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Home Address *</label>
                    <input
                      type="text"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className={INPUT_CLASS}
                      placeholder="Full Address"
                    />
                  </div>
                </div>

                {/* Credentials section */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Login Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="student@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">
                        New Password <span className="text-white/30">(leave blank to keep current)</span>
                      </label>
                      <input
                        type="password"
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Deposit & Status */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Security & Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={editForm.securityDeposit}
                        onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Refund Amount Paid (₹)</label>
                      <input
                        type="number"
                        value={editForm.refundAmount}
                        onChange={(e) => setEditForm({ ...editForm, refundAmount: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="e.g. 5000"
                        disabled={!editForm.hasLeft}
                      />
                      {!editForm.hasLeft && (
                        <p className="text-[11px] text-muted-foreground/60 italic mt-1">Mark student as left to enter refund amount.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setEditForm({ ...editForm, hasLeft: !editForm.hasLeft, refundAmount: !editForm.hasLeft ? editForm.refundAmount : "" })}
                        className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${editForm.hasLeft ? 'bg-red-500' : 'bg-white/10'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${editForm.hasLeft ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-sm font-medium text-white group-hover:text-white/80 transition-colors">
                        Mark Student as Left Hostel
                        {editForm.hasLeft && <span className="ml-2 text-xs text-red-400 font-semibold">(LEFT)</span>}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 flex-shrink-0">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: Assign Room ===== */}
      <AnimatePresence>
        {isAssignModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121214] border border-white/5 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-white">Assign Room</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              {error && <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex-shrink-0">{error}</div>}
              <form onSubmit={handleAssignRoom} className="space-y-5 overflow-y-auto flex-1 pr-1 -mr-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select Room for {selectedStudent.fullName}</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      setSelectedLocationInRoom("");
                    }}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">No Room (Unassign)</option>
                    {rooms.map((room) => {
                      const occ = room.students?.length || 0;
                      return (
                        <option key={room.id} value={room.id} disabled={occ >= room.capacity && room.id !== selectedStudent.roomId}>
                          Room {room.roomNumber} ({room.type.replace("_", " ")}) — {occ}/{room.capacity} occupied
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedRoomId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Select Spot / Location in Room</label>
                    <select
                      value={selectedLocationInRoom}
                      onChange={(e) => setSelectedLocationInRoom(e.target.value)}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Select Location</option>
                      {(rooms.find(r => r.id === selectedRoomId)?.locations || []).map((loc: string) => {
                        const isOccupied = rooms.find(r => r.id === selectedRoomId)?.students?.some((s: any) => s.locationInRoom === loc && s.id !== selectedStudent.id);
                        return (
                          <option key={loc} value={loc} disabled={isOccupied}>
                            {loc} {isOccupied ? "(Occupied)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 flex-shrink-0">
                  <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== MODAL: View Student Details ===== */}
      <AnimatePresence>
        {isViewModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#121214] border border-white/5 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                    {selectedStudent.photo ? (
                      <img
                        src={selectedStudent.photo}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={32} className="text-muted-foreground/50" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{selectedStudent.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto flex-1 pr-1 -mr-1 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal details */}
                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Personal Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Mobile Number</span>
                        <span className="text-white font-medium">{selectedStudent.mobile || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Date of Birth</span>
                        <span className="text-white font-medium">{selectedStudent.dob || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Blood Group</span>
                        <span className="text-white font-medium">{selectedStudent.bloodGroup || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Vehicle Number</span>
                        <span className="text-white font-medium">{selectedStudent.vehicleNo || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room assignment */}
                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Room & Spot Assignment</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Room Number</span>
                        <span className="text-white font-medium">
                          {selectedStudent.room ? `Room ${selectedStudent.room.roomNumber}` : "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Room Type</span>
                        <span className="text-white font-medium">
                          {selectedStudent.room ? selectedStudent.room.type.replace("_", " ") : "N/A"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground block">Spot Location in Room</span>
                        <span className="text-white font-medium">{selectedStudent.locationInRoom || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security & Status */}
                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Security & Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Security Deposit</span>
                        <span className="text-white font-medium">
                          ₹{selectedStudent.securityDeposit || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Status</span>
                        <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full inline-block ${selectedStudent.hasLeft ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                          {selectedStudent.hasLeft ? 'Left Hostel' : 'Active'}
                        </span>
                      </div>
                      {selectedStudent.hasLeft && (
                        <>
                          <div>
                            <span className="text-xs text-muted-foreground block">Left Date</span>
                            <span className="text-white font-medium">
                              {selectedStudent.leftDate ? new Date(selectedStudent.leftDate).toLocaleDateString("en-IN") : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Refund Amount Paid</span>
                            <span className="text-white font-medium">
                              ₹{selectedStudent.refundAmount || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Academic Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground block">College Name</span>
                        <span className="text-white font-medium">{selectedStudent.collegeName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Course / Branch</span>
                        <span className="text-white font-medium">{selectedStudent.course || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Year of Study</span>
                        <span className="text-white font-medium">
                          {selectedStudent.yearOfStudy === "Other"
                            ? selectedStudent.yearOfStudyOther
                            : selectedStudent.yearOfStudy || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Academic Year Status</span>
                        <span className="text-white font-medium">
                          {selectedStudent.academicYear === "PREVIOUS" ? "Previous Year" : "Current Year"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Admission Date</span>
                        <span className="text-white font-medium">
                          {selectedStudent.admissionDate
                            ? new Date(selectedStudent.admissionDate).toLocaleDateString("en-IN")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Details */}
                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Guardian Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Parent / Guardian Name</span>
                        <span className="text-white font-medium">{selectedStudent.parentName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Parent Contact</span>
                        <span className="text-white font-medium">{selectedStudent.parentContact || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Secondary Guardian Name</span>
                        <span className="text-white font-medium">{selectedStudent.guardianName2 || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Secondary Guardian Contact</span>
                        <span className="text-white font-medium">{selectedStudent.guardianContact2 || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-span-1 md:col-span-2 space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Home Address</h4>
                    <div>
                      <span className="text-xs text-muted-foreground block">Address</span>
                      <span className="text-white font-medium">{selectedStudent.address || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5 mt-6 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white font-semibold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
