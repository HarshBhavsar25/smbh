"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DoorClosed, Plus, Trash2, Edit2, Users, Loader2, X, AlertTriangle 
} from "lucide-react";

export default function RoomsAdminPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newLocationInput, setNewLocationInput] = useState("");

  const [formData, setFormData] = useState({
    roomNumber: "",
    capacity: 2,
    type: "TWO_SHARING",
    cupboard: false,
    bed: false,
    geyser: false,
    electricBoard: false,
    locations: [] as string[]
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rooms`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRooms(data);
      }
    } catch (err) {
      console.error("Error fetching rooms", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (room: any = null) => {
    setSelectedRoom(room);
    if (room) {
      setFormData({
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        type: room.type,
        cupboard: room.cupboard || false,
        bed: room.bed || false,
        geyser: room.geyser || false,
        electricBoard: room.electricBoard || false,
        locations: room.locations || []
      });
    } else {
      setFormData({
        roomNumber: "",
        capacity: 2,
        type: "TWO_SHARING",
        cupboard: false,
        bed: false,
        geyser: false,
        electricBoard: false,
        locations: []
      });
    }
    setNewLocationInput("");
    setError("");
    setIsModalOpen(true);
  };

  const handleAddLocation = () => {
    if (!newLocationInput.trim()) return;
    if (formData.locations.includes(newLocationInput.trim())) {
      setError("Location already exists in this room.");
      return;
    }
    setFormData({
      ...formData,
      locations: [...formData.locations, newLocationInput.trim()]
    });
    setNewLocationInput("");
  };

  const handleRemoveLocation = (locToRemove: string) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter(l => l !== locToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    const method = selectedRoom ? "PATCH" : "POST";
    const url = selectedRoom 
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rooms/${selectedRoom.id}`
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rooms`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          capacity: Number(formData.capacity),
          type: formData.type,
          cupboard: formData.cupboard,
          bed: formData.bed,
          geyser: formData.geyser,
          electricBoard: formData.electricBoard,
          locations: formData.locations
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rooms/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRooms();
      }
    } catch (err) {
      console.error("Delete room error", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Room Management</h1>
          <p className="text-muted-foreground">Manage rooms, occupants, layouts, and occupancy status.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} /> Add New Room
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const currentOccupancy = room.students?.length || 0;
            const isFull = currentOccupancy >= room.capacity;
            const occupancyPercentage = (currentOccupancy / room.capacity) * 100;
            
            return (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl border border-white/5 bg-[#121214] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <DoorClosed size={24} />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      isFull ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {isFull ? "Full" : "Available"}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1">Room {room.roomNumber}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-6">
                    {room.type.replace('_', ' ')}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
                        <span>Occupancy</span>
                        <span>{currentOccupancy} / {room.capacity} Beds</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${occupancyPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Room Facilities list */}
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Facilities</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { name: "Cupboard", active: room.cupboard },
                          { name: "Bed", active: room.bed },
                          { name: "Geyser", active: room.geyser },
                          { name: "Electric Board", active: room.electricBoard }
                        ].map((facility) => (
                          <div
                            key={facility.name}
                            className={`flex items-center gap-1.5 ${
                              facility.active ? "text-emerald-500 font-medium" : "text-muted-foreground/30 line-through"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${facility.active ? "bg-emerald-500" : "bg-white/10"}`} />
                            {facility.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Room Locations list */}
                    {room.locations && room.locations.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-muted-foreground block mb-2">Available Spots</span>
                        <div className="flex flex-wrap gap-1.5">
                          {room.locations.map((loc: string) => {
                            const isOccupied = room.students?.some((s: any) => s.locationInRoom === loc);
                            return (
                              <span
                                key={loc}
                                className={`text-[10px] px-2 rounded-full border ${
                                  isOccupied
                                    ? "bg-red-500/10 border-red-500/10 text-red-400"
                                    : "bg-emerald-500/10 border-emerald-500/10 text-emerald-400"
                                } font-semibold`}
                              >
                                {loc} {isOccupied ? "• Occupied" : ""}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {room.students && room.students.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-muted-foreground block mb-2">Residents</span>
                        <div className="flex flex-wrap gap-2">
                          {room.students.map((student: any) => (
                            <span 
                              key={student.id} 
                              className="text-xs bg-white/5 border border-white/5 rounded-full px-3 py-1 text-white font-medium flex items-center gap-1.5"
                            >
                              <Users size={12} className="text-muted-foreground" /> {student.fullName} {student.locationInRoom ? `(${student.locationInRoom})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleOpenModal(room)}
                    className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Rooms Configured</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create rooms to start assigning residents.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Create First Room
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-white">{selectedRoom ? "Edit Room" : "Add New Room"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex-shrink-0">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 pr-1 -mr-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Room Number</label>
                  <input 
                    type="text" 
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. 101, 202, B-4"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Capacity (Beds)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Room Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="TWO_SHARING">2 Sharing</option>
                    <option value="THREE_SHARING">3 Sharing</option>
                    <option value="FIVE_SHARING">5 Sharing</option>
                  </select>
                </div>

                {/* Facilities checkmarks */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block">Room Facilities</label>
                  <div className="grid grid-cols-2 gap-3 bg-[#16161a] border border-white/5 rounded-xl p-4">
                    {[
                      { label: "Cupboard", key: "cupboard" },
                      { label: "Bed", key: "bed" },
                      { label: "Geyser", key: "geyser" },
                      { label: "Electric Board", key: "electricBoard" }
                    ].map(({ label, key }) => (
                      <label key={key} className="flex items-center gap-2.5 text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(formData as any)[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="w-4 h-4 rounded border-white/10 bg-[#121214] text-primary focus:ring-primary/50"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Locations in Room */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Locations / Beds in Room</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLocationInput}
                      onChange={(e) => setNewLocationInput(e.target.value)}
                      placeholder="e.g. Bed A, Bed B, Desk 1"
                      className="flex-1 bg-[#16161a] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLocation();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddLocation}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.locations.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-[#16161a] border border-white/5 rounded-xl min-h-[60px]">
                      {formData.locations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-200 text-xs font-semibold"
                        >
                          {loc}
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(loc)}
                            className="text-primary-300 hover:text-white transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No locations added yet. Add locations for resident assignment.</p>
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-8 flex-shrink-0 pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Room"}
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
