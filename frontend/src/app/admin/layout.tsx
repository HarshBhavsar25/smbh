"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { 
  LayoutDashboard, Users, DoorClosed, 
  CreditCard, MessageSquare, Image as ImageIcon, 
  Settings, LogOut, Bell, Search, Plane, FileText, UserMinus,
  Menu, X
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.profileImage) {
          setProfileImage(data.profileImage);
        }
      })
      .catch(console.error);
    }
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Residents", href: "/admin/students", icon: <Users size={20} /> },
    { name: "Rooms", href: "/admin/rooms", icon: <DoorClosed size={20} /> },
    { name: "Payments", href: "/admin/fees", icon: <CreditCard size={20} /> },
    { name: "Community Feed", href: "/admin/complaints", icon: <MessageSquare size={20} /> },
    { name: "Announcements", href: "/admin/posts", icon: <Bell size={20} /> },
    { name: "Gallery", href: "/admin/gallery", icon: <ImageIcon size={20} /> },
    { name: "Leave Notices", href: "/admin/leaves", icon: <UserMinus size={20} /> },
    { name: "Hostel Rules", href: "/admin/rules", icon: <FileText size={20} /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
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
              className="fixed top-0 bottom-0 left-0 w-64 bg-[#0f0f13] border-r border-white/5 flex flex-col z-50 md:hidden"
            >
              <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                    SM
                  </div>
                  <div>
                    <h1 className="font-bold text-sm tracking-tight text-white">Shree Mauli</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Admin Console</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
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

              <div className="p-4 border-t border-white/5 space-y-2">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/admin/students");
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-medium text-sm flex items-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                   <Plane size={18} /> Register Resident
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    localStorage.removeItem("token");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("studentId");
                    router.push("/");
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                >
                   <LogOut size={18} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#0f0f13] flex flex-col hidden md:flex shrink-0 relative z-20">
        <div className="h-20 shrink-0 flex items-center px-6 gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            SM
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">Shree Mauli</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Admin Console</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
            return (
              <Link key={item.name} href={item.href} className="relative block">
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
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

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => router.push("/admin/students")}
            className="w-full px-4 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-medium text-sm flex items-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
          >
             <Plane size={18} /> Register Resident
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userRole");
              localStorage.removeItem("studentId");
              router.push("/");
            }}
            className="w-full px-4 py-3 flex items-center gap-3 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
          >
             <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="h-20 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl md:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-white hidden md:block">Overview</h2>
          </div>
          
          <div className="flex-1 md:ml-8 max-w-xl px-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-[#16161a] border border-white/5 rounded-full py-2 pl-9 pr-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full border border-background"></span>
            </button>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-secondary to-accent p-[2px]">
              <div className="w-full h-full bg-background rounded-full border-2 border-background overflow-hidden relative">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={profileImage || "/admin-avatar.jpg"} alt="Admin" className="w-full h-full object-cover opacity-80" />
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
