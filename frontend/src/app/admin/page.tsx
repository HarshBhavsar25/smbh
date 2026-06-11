"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Users, DoorClosed, AlertTriangle, ArrowUpRight, BedDouble, 
  Download, CreditCard, MessageSquare, Loader2, RefreshCw 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // Fetch students
      const studRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students`, { headers });
      if (studRes.ok) setStudents(await studRes.ok ? await studRes.json() : []);

      // Fetch rooms
      const roomRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/rooms`, { headers });
      if (roomRes.ok) setRooms(await roomRes.ok ? await roomRes.json() : []);

      // Fetch complaints
      const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/complaints`, { headers });
      if (compRes.ok) setComplaints(await compRes.ok ? await compRes.json() : []);

      // Fetch fees
      const feeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/fees`, { headers });
      if (feeRes.ok) setFees(await feeRes.ok ? await feeRes.json() : []);

      // Fetch vacations
      const vacRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/vacations`, { headers });
      if (vacRes.ok) setVacations(await vacRes.ok ? await vacRes.json() : []);
    } catch (err) {
      console.error("Error fetching dashboard statistics", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  // 1. Stats calculations
  const totalStudents = students.filter(s => !s.hasLeft).length;
  const occupiedBeds = students.filter(s => !s.hasLeft && s.roomId).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
  const totalRooms = rooms.length;
  const onVacation = vacations.filter(v => v.status === "ON_VACATION").length;
  const pendingIssues = complaints.filter(c => c.status !== "RESOLVED" && c.status !== "CLOSED").length;
  
  // Calculate current month's collection
  const now = new Date();
  const currentMonthPaid = fees.filter(f => {
    const pDate = new Date(f.paymentDate);
    return f.status === 'PAID' && pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
  }).reduce((sum, f) => sum + f.amount, 0);

  const stats = [
    { label: "Total Students", value: totalStudents.toString(), icon: <Users size={16}/> },
    { label: "Occupied Beds", value: occupiedBeds.toString(), sub: `/ ${totalCapacity}`, icon: <BedDouble size={16}/> },
    { label: "Vacant Beds", value: vacantBeds.toString(), icon: <BedDouble size={16}/> },
    { label: "Total Rooms", value: totalRooms.toString(), icon: <DoorClosed size={16}/> },
    { label: "On Vacation", value: onVacation.toString(), icon: <Users size={16}/> },
    { label: "Pending Issues", value: pendingIssues.toString(), icon: <AlertTriangle size={16}/>, alert: pendingIssues > 0 },
    { label: "Monthly Rev", value: `₹${(currentMonthPaid / 1000).toFixed(1)}k`, icon: <ArrowUpRight size={16}/>, trend: "Current" },
  ];

  // 2. Chart data calculations
  const getChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result: any[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();

      const monthlyPayments = fees.filter(f => {
        const pDate = new Date(f.paymentDate);
        return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year;
      });

      const paidSum = monthlyPayments
        .filter(f => f.status === "PAID")
        .reduce((sum, f) => sum + f.amount, 0);

      const pendingSum = monthlyPayments
        .filter(f => f.status === "PENDING")
        .reduce((sum, f) => sum + f.amount, 0);

      result.push({
        name: `${monthName}`,
        Collection: paidSum,
        Pending: pendingSum
      });
    }
    return result;
  };

  const chartData = getChartData();

  // Pie chart calculation
  const getPieData = () => {
    const doubleSharing = rooms.filter(r => r.type === "TWO_SHARING");
    const tripleSharing = rooms.filter(r => r.type === "THREE_SHARING");
    const fiveSharing = rooms.filter(r => r.type === "FIVE_SHARING");

    const doubleOccupied = doubleSharing.reduce((sum, r) => sum + (r.students?.length || 0), 0);
    const tripleOccupied = tripleSharing.reduce((sum, r) => sum + (r.students?.length || 0), 0);
    const fiveOccupied = fiveSharing.reduce((sum, r) => sum + (r.students?.length || 0), 0);

    return [
      { name: 'Double', value: doubleOccupied || 0 },
      { name: 'Triple', value: tripleOccupied || 0 },
      { name: 'Five', value: fiveOccupied || 0 }
    ].filter(item => item.value > 0);
  };

  const pieData = getPieData().length > 0 ? getPieData() : [
    { name: 'Double', value: 1 },
    { name: 'Triple', value: 1 }
  ];

  // 3. Dynamic Activity Feed
  const getRecentActivities = () => {
    const list: any[] = [];
    
    // Students
    students.forEach(s => {
      list.push({
        title: "Student Registered",
        desc: `${s.fullName} registered in Room ${s.room?.roomNumber || 'Unassigned'}`,
        date: new Date(s.admissionDate || s.createdAt),
        icon: <Users size={14} />
      });
    });

    // Payments
    fees.forEach(f => {
      list.push({
        title: f.status === "PAID" ? "Fee Verified" : `Fee submitted (${f.status})`,
        desc: `₹${f.amount.toLocaleString("en-IN")} from ${f.student?.fullName || 'Resident'}`,
        date: new Date(f.paymentDate),
        icon: <ArrowUpRight size={14} />
      });
    });

    // Complaints
    complaints.forEach(c => {
      list.push({
        title: "Complaint Logged",
        desc: `"${c.title}" by ${c.student?.fullName || 'Resident'}`,
        date: new Date(c.createdAt),
        icon: <AlertTriangle size={14} />
      });
    });

    // Sort descending and take top 4
    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  };

  const activities = getRecentActivities();

  // Percentage full calculation
  const totalBedsCount = totalCapacity || 1;
  const occupancyPercentage = Math.round((occupiedBeds / totalBedsCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
          <p className="text-muted-foreground">Here's what's happening at Shree Mauli today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[#16161a] border border-white/5 rounded-lg text-sm text-white font-medium hover:bg-white/5 transition-colors">
            {currentDate || "Loading..."}
          </button>
          <button 
            onClick={fetchDashboardData}
            className="p-2 bg-[#16161a] border border-white/5 rounded-lg text-white hover:bg-white/5 transition-colors"
            title="Reload Dashboard"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`min-w-[140px] flex-1 p-5 rounded-2xl border ${stat.alert ? 'border-destructive bg-destructive/10' : 'border-white/5 bg-[#121214]'} flex flex-col justify-between`}
          >
            <div className={`flex justify-between items-start mb-4 ${stat.alert ? 'text-destructive' : 'text-muted-foreground'}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-bold ${stat.alert ? 'text-destructive' : 'text-white'}`}>{stat.value}</h3>
              {stat.sub && <span className="text-muted-foreground text-sm font-medium">{stat.sub}</span>}
              {stat.trend && <span className="text-emerald-500 text-xs font-bold">{stat.trend}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* MAIN CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Collections History</h3>
              <span className="text-xs font-semibold text-muted-foreground bg-white/5 px-3 py-1 rounded-md">Last 6 Months</span>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} dy={10} />
                  <Tooltip contentStyle={{backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} />
                  <Area type="monotone" dataKey="Collection" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCollection)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Pending vs Collected</h3>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="Collection" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Room Utilisation</h3>
              <div className="h-[150px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#ec4899" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">{occupancyPercentage}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Occupied</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{
                      backgroundColor: index === 0 ? "#3b82f6" : index === 1 ? "#8b5cf6" : "#ec4899"
                    }}></div>
                    <span className="text-xs text-muted-foreground font-semibold">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Student", href: "/admin/students", icon: <Users size={20}/> },
                { label: "Assign Room", href: "/admin/rooms", icon: <DoorClosed size={20}/> },
                { label: "Add Fee", href: "/admin/fees", icon: <CreditCard size={20}/> },
                { label: "Announce", href: "/admin/posts", icon: <MessageSquare size={20}/> },
              ].map((action, i) => (
                <Link 
                  href={action.href}
                  key={i} 
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-[#16161a] hover:bg-white/5 transition-colors text-muted-foreground hover:text-white gap-2"
                >
                  {action.icon}
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-white/5 bg-[#121214] shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h3>
            </div>
            {activities.length > 0 ? (
              <div className="space-y-6">
                {activities.map((act, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== activities.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-white/10"></div>}
                    <div className="w-8 h-8 rounded-full bg-[#16161a] border border-white/10 flex items-center justify-center text-muted-foreground shrink-0 z-10">
                      {act.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{act.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{act.desc}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(act.date).toLocaleDateString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
