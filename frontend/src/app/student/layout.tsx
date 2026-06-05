"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, CreditCard, MessageSquare, 
  Plane, LogOut, Bell, Search, Info, UserMinus,
  Menu, X
} from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [student, setStudent] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      const token = localStorage.getItem("token");
      const studentId = localStorage.getItem("studentId");
      if (!token || !studentId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${studentId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          setStudent(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudent();
  }, []);

  const navItems = [
    { name: "My Space", href: "/student", icon: <LayoutDashboard size={20} /> },
    { name: "Fee Status", href: "/student/fees", icon: <CreditCard size={20} /> },
    { name: "Vacation", href: "/student/vacation", icon: <Plane size={20} /> },
    { name: "Community", href: "/student/community", icon: <MessageSquare size={20} /> },
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
              <div>
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
                
                <nav className="p-4 space-y-1">
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
                    localStorage.removeItem("token");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("studentId");
                    router.push("/");
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
        <div>
          <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              SM
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white">Shree Mauli</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Student Portal</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
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
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userRole");
              localStorage.removeItem("studentId");
              router.push("/");
            }}
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
          
          <div className="flex-1 lg:ml-8 max-w-xl">
             {/* Search can be omitted for students or kept minimal */}
          </div>

          <div className="flex items-center gap-4 ml-6 shrink-0">
            <button className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
            </button>
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
