"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, CreditCard, MessageSquare, 
  Plane, LogOut, Bell, Info, UserMinus,
  Menu, X, CheckCheck, AlertCircle, Megaphone, FileText
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [student, setStudent] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("studentId");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("studentId");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch student profile
    if (studentId) {
      fetch(`${API}/students/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (res.status === 401) {
            handleLogout();
            throw new Error("Unauthorized");
          }
          return res.ok ? res.json() : null;
        })
        .then(data => { if (data) setStudent(data); })
        .catch(console.error);
    }

    // Fetch notifications
    fetchNotifications(token);
    const interval = setInterval(() => fetchNotifications(token), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (token: string) => {
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`${API}/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`${API}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Close notif dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: "My Space", href: "/student", icon: <LayoutDashboard size={20} /> },
    { name: "Announcements", href: "/student/announcements", icon: <Bell size={20} /> },
    { name: "Fee Status", href: "/student/fees", icon: <CreditCard size={20} /> },
    { name: "Vacation", href: "/student/vacation", icon: <Plane size={20} /> },
    { name: "Complaints", href: "/student/community", icon: <MessageSquare size={20} /> },
    { name: "Documents", href: "/student/documents", icon: <FileText size={20} /> },
    { name: "Hostel Rules", href: "/student/rules", icon: <Info size={20} /> },
    { name: "Leave Hostel", href: "/student/leave", icon: <UserMinus size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      
      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-[#0f0f13] border-r border-white/5 flex flex-col justify-between z-50 md:hidden"
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                      SM
                    </div>
                    <div>
                      <h1 className="font-bold text-sm tracking-tight text-white">Shree Mauli</h1>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Student Portal</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <nav className="p-4 space-y-1 overflow-y-auto flex-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/student');
                    return (
                      <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="relative block">
                        {isActive && (
                          <div className="absolute inset-0 bg-white/10 rounded-xl" />
                        )}
                        <div className={`relative px-4 py-3 flex items-center gap-3 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                          {item.icon}
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-white/5 space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden border border-white/10">
                     {student?.photo ? (
                       <img src={student.photo} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       student?.fullName ? student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "ST"
                     )}
                   </div>
                   <div className="overflow-hidden">
                     <p className="text-sm font-semibold text-white truncate">{student?.fullName || "Resident"}</p>
                     <p className="text-xs text-muted-foreground truncate">{student?.room ? `Room ${student.room.roomNumber}` : 'Unassigned'}</p>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                >
                   <LogOut size={18} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#0f0f13] flex flex-col justify-between hidden md:flex shrink-0 relative z-20">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              SM
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white">Shree Mauli</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Student Portal</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/student');
              return (
                <Link key={item.name} href={item.href} className="relative block">
                  {isActive && (
                    <motion.div 
                      layoutId="student-sidebar-active"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`relative px-4 py-3 flex items-center gap-3 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                    {item.icon}
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden border border-white/10">
               {student?.photo ? (
                 <img src={student.photo} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 student?.fullName ? student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "ST"
               )}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-semibold text-white truncate">{student?.fullName || "Resident"}</p>
               <p className="text-xs text-muted-foreground truncate">{student?.room ? `Room ${student.room.roomNumber}` : 'Unassigned'}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
          >
             <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="h-20 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl md:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-white hidden md:block">My Space</h2>
          </div>
          
          <div className="flex-1" />

          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary rounded-full border border-background flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-[320px] sm:w-[360px] bg-[#121214] border border-white/8 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Bell size={15} className="text-primary" />
                        <span className="font-semibold text-sm text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[380px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <Bell size={20} className="text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => markOneRead(notif.id)}
                            className={`w-full text-left px-4 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors ${!notif.isRead ? 'bg-primary/[0.04]' : ''}`}
                          >
                            <div className="flex gap-3 items-start">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                notif.title?.includes('URGENT') || notif.title?.includes('Status')
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {notif.title?.includes('Status') || notif.title?.includes('Comment') ? (
                                  <AlertCircle size={14} />
                                ) : (
                                  <Megaphone size={14} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight truncate ${notif.isRead ? 'text-muted-foreground' : 'text-white'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                  {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-white/5 text-center">
                        <Link 
                          href="/student/announcements" 
                          onClick={() => setIsNotifOpen(false)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          View all announcements →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px]">
              <div className="w-full h-full bg-background rounded-full border-2 border-background overflow-hidden relative flex items-center justify-center text-xs font-bold text-primary">
                 {student?.photo ? (
                   <img src={student.photo} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   student?.fullName ? student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "ST"
                 )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}
