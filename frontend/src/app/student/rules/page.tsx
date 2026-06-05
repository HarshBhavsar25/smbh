"use client";

import { useState, useEffect } from "react";
import { Info, ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HostelRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rules`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRules(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Hostel Rules & Regulations</h1>
        <p className="text-muted-foreground">Please read and abide by the guidelines below to maintain a safe and comfortable environment.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={rule.id}
              className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl flex items-start gap-4"
            >
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{rule.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{rule.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 glass-card rounded-3xl border border-white/5 bg-[#121214]">
          <Info className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Rules Listed</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Standard hostel guidelines are currently active. Check back later for updates.</p>
        </div>
      )}
    </div>
  );
}
