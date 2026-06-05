"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Calendar, MessageCircle, Send } from "lucide-react";

export default function VacationPage() {
  const [reason, setReason] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate WhatsApp Message Generation
    const message = `Hello Sir,\n\nI am Rahul Desai.\nI am going home from ${departure}.\n\nReason:\n${reason}\n\nExpected Return:\n${returnDate}\n\nThank You.`;
    const whatsappUrl = `https://wa.me/919881903999?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Vacation Request</h1>
        <p className="text-muted-foreground">Submit a request to go home. This will automatically notify the warden via WhatsApp.</p>
      </div>

      <div className="p-8 rounded-3xl border border-white/5 bg-[#121214] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2"><Calendar size={14}/> Departure Date</label>
              <input 
                type="date" 
                required
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2"><Calendar size={14}/> Expected Return Date (Optional)</label>
              <input 
                type="date" 
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Reason for Vacation</label>
            <textarea 
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Diwali holidays, Medical checkup, Family function..."
              className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground flex gap-3">
            <MessageCircle size={20} className="text-primary shrink-0" />
            <p>Upon submission, the system will save the record, email the admin, and automatically open WhatsApp with a pre-filled message for you to send to the warden.</p>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Send size={18} /> Submit & Open WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
