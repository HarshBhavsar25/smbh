"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, Search, Edit2, Trash2, DoorClosed, 
  Phone, Mail, BookOpen, MapPin, X, Check, Loader2, CreditCard
} from "lucide-react";

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Form states
  const [newStudent, setNewStudent] = useState({
    email: "",
    password: "", // entered by admin
    fullName: "",
    mobile: "",
    collegeName: "",
    course: "",
    parentName: "",
    parentContact: "",
    address: "",
  });
  
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // Fetch Students
      const studentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students`, { headers });
      const studentData = await studentRes.json();
      if (Array.isArray(studentData)) {
        setStudents(studentData);
      }

      // Fetch Rooms
      const roomRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rooms`, { headers });
      const roomData = await roomRes.json();
      if (Array.isArray(roomData)) {
        setRooms(roomData);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStudent, role: "STUDENT" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create student");
      }

      setIsAddModalOpen(false);
      // Reset form
      setNewStudent({
        email: "",
        password: "",
        fullName: "",
        mobile: "",
        collegeName: "",
        course: "",
        parentName: "",
        parentContact: "",
        address: "",
      });
      fetchData(); // refresh list
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${selectedStudent.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roomId: selectedRoomId || null }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign room");
      }

      setIsAssignModalOpen(false);
      setSelectedStudent(null);
      setSelectedRoomId("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.room?.roomNumber && student.room.roomNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Search Bar */}
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

      {/* Main Grid/Table */}
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
                        student.feeStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                        student.feeStatus === "PARTIAL" ? "bg-blue-500/10 text-blue-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        <CreditCard size={12} /> {student.feeStatus}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          title="Assign Room"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSelectedRoomId(student.roomId || "");
                            setIsAssignModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        >
                          <DoorClosed size={16} />
                        </button>
                        <button 
                          title="Delete Student"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
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

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Add New Student</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.fullName}
                      onChange={(e) => setNewStudent({...newStudent, fullName: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Login Password</label>
                    <input 
                      type="password" 
                      required
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.mobile}
                      onChange={(e) => setNewStudent({...newStudent, mobile: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">College Name</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.collegeName}
                      onChange={(e) => setNewStudent({...newStudent, collegeName: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="COEP, Pune"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Course / Branch</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.course}
                      onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="B.Tech Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Parent / Guardian Name</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.parentName}
                      onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="Robert Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Parent Contact</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.parentContact}
                      onChange={(e) => setNewStudent({...newStudent, parentContact: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="+91 98765 43211"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Home Address</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({...newStudent, address: e.target.value})}
                      className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="Full Address"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Create Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Room Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Assign Room</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAssignRoom} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select Room for {selectedStudent.fullName}</label>
                  <select 
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">No Room (Unassign)</option>
                    {rooms.map(room => {
                      const currentOccupancy = room.students?.length || 0;
                      return (
                        <option 
                          key={room.id} 
                          value={room.id}
                          disabled={currentOccupancy >= room.capacity && room.id !== selectedStudent.roomId}
                        >
                          Room {room.roomNumber} ({room.type.replace('_', ' ')}) - {currentOccupancy}/{room.capacity} occupied
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
