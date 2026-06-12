"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, Shield, Zap, Droplets, MapPin, Phone, Mail,
  Wind, Lock, Coffee, Monitor, CheckCircle2, BedDouble, ArrowRight, X, LayoutDashboard, Download
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import InstallAppButton from "@/components/InstallAppButton";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [galleryMedia, setGalleryMedia] = useState<{ id: string, url: string, type: string }[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has a valid session
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/gallery`)
      .then(res => res.json())
      .then(data => setGalleryMedia(data))
      .catch(err => console.error("Gallery fetch error", err));
  }, []);
  const facilities = [
    { icon: <BedDouble />, title: "Single Bed", desc: "Comfortable cotton mattress" },
    { icon: <Wind />, title: "Cooler & AC", desc: "Well-ventilated rooms" },
    { icon: <Droplets />, title: "24/7 Hot & Cold Water", desc: "Geyser facilities available" },
    { icon: <Wifi />, title: "Unlimited Wi-Fi", desc: "High-speed internet for studies" },
    { icon: <Shield />, title: "24/7 Security", desc: "CCTV & Watchman on duty" },
    { icon: <Zap />, title: "Individual Charging", desc: "Power point at every bed" },
    { icon: <Lock />, title: "Iron Cupboards", desc: "Large storage for every student" },
    { icon: <Coffee />, title: "Filtered Water", desc: "Safe drinking water facility" },
  ];

  const roomTypes = [
    { type: "2 Sharing", price: "Premium", desc: "Perfect for focused study and privacy." },
    { type: "3 Sharing", price: "Popular", desc: "Great balance of community and comfort." },
    { type: "5 Sharing", price: "Economical", desc: "Spacious rooms for larger groups." },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-lg shadow-lg">
              MBH
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Shree Mauli Boys Hostel</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#home" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="#facilities" className="hover:text-foreground transition-colors">Facilities</Link>
            <Link href="#rooms" className="hover:text-foreground transition-colors">Rooms</Link>
            <Link href="#gallery" className="hover:text-foreground transition-colors">Gallery</Link>
            <Link href="#location" className="hover:text-foreground transition-colors">Location</Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <InstallAppButton appName="Shree Mauli Hostel" />
            {isLoggedIn ? (
              <Link
                href={userRole === "ADMIN" ? "/admin" : "/student"}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            ) : (
              <Link href="/login" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px] mix-blend-screen" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Premium Living <br />
              <span className="text-gradient">For Students.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Experience the best accommodation exclusively for college boys. Safe, study-friendly, and equipped with all modern amenities near the main road.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a href="tel:+919881903999" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2">
                <Phone size={18} /> Call Now
              </a>
              <Link href="/fill_application_form" className="px-8 py-4 rounded-full glass-card hover:bg-white/5 transition-all font-semibold flex items-center gap-2">
                Fill Application Form
              </Link>
              <a href="https://wa.me/919881903999" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full glass-card hover:bg-white/5 transition-all font-semibold flex items-center gap-2">
                WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[400px] md:h-[600px] rounded-3xl overflow-hidden glass-card p-2"
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image
                src="/hero.jpg"
                alt="Shree Mauli Hostel Exterior"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FACILITIES */}
      <section id="facilities" className="py-24 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">World-Class <span className="text-gradient">Facilities</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need for a comfortable and focused college life under one roof.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((fac, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 rounded-2xl hover:-translate-y-2 transition-transform duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {fac.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{fac.title}</h3>
                <p className="text-sm text-muted-foreground">{fac.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROOM TYPES */}
      <section id="rooms" className="py-24 relative z-10 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your <span className="text-gradient">Space</span></h2>
              <p className="text-muted-foreground max-w-xl">Fully furnished rooms designed for maximum comfort and study focus.</p>
            </div>
            <a
              href="https://wa.me/919881903999?text=Hello,%20I%20would%20like%20to%20book%20a%20visit%20to%20Shree%20Mauli%20Boys%20Hostel."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium group"
            >
              Book a Visit <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative h-[400px] lg:h-auto rounded-3xl overflow-hidden glass-card p-2 group">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image src="/room.jpg" alt="Hostel Room" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass px-4 py-2 rounded-lg w-fit mb-3 text-sm font-medium">Featured</div>
                  <h3 className="text-2xl font-bold mb-2">Modern 2 Sharing Room</h3>
                  <p className="text-muted-foreground text-sm">Experience premium privacy and comfort with dedicated study areas.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {roomTypes.map((room, i) => (
                <div key={i} className="glass-card p-6 rounded-3xl flex-1 flex flex-col justify-center hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{room.type}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-md">{room.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{room.desc}</p>
                  <ul className="space-y-2 mt-auto">
                    {['Individual Cupboard', 'Study Table', 'Charging Point'].map((feat, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={14} className="text-primary" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* GALLERY */}
      <section id="gallery" className="py-24 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Hostel <span className="text-gradient">Gallery</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A glimpse into life at Shree Mauli Boys Hostel.</p>
          </div>

          {galleryMedia.length > 0 ? (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {galleryMedia.slice(0, 6).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative aspect-square rounded-2xl overflow-hidden glass-card group bg-black flex items-center justify-center border border-white/5 cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
                  >
                    {item.type === "VIDEO" ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt="Gallery Media"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {galleryMedia.length > 6 && (
                <div className="flex justify-center">
                  <Link href="/gallery" className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2 text-sm">
                    View Full Gallery <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 glass-card rounded-3xl border border-white/5 bg-[#121214]">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <p className="text-muted-foreground font-medium">No media uploaded to the gallery yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* LOCATION & CONTACT */}
      <section id="location" className="py-24 relative z-10 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Find <span className="text-gradient">Us</span></h2>
            <p className="text-muted-foreground mb-12">Conveniently located near the main road with excellent bus and auto connectivity.</p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full glass flex items-center justify-center shrink-0 text-primary">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Address</h4>
                  <p className="text-muted-foreground text-sm">299, Janawadi, Off Senapati Bapat Road, Pune – 411016</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full glass flex items-center justify-center shrink-0 text-primary">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Phone</h4>
                  <p className="text-muted-foreground text-sm">+91 98819 03999</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full glass flex items-center justify-center shrink-0 text-primary">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Email</h4>
                  <p className="text-muted-foreground text-sm">shreemauliboyshostel@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-2 rounded-3xl h-[400px] lg:h-auto overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3782.9607559545225!2d73.8221031751919!3d18.530675482564877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTjCsDMxJzUwLjQiTiA3M8KwNDknMjguOCJF!5e0!3m2!1sen!2sin!4v1780594198829!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '1.25rem', filter: 'invert(90%) hue-rotate(180deg)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black/40 py-12 px-6 text-sm text-center text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg">
              SM
            </div>
            <span className="font-bold text-foreground">Shree Mauli Boys Hostel</span>
          </div>
          <p>© {new Date().getFullYear()} Shree Mauli Boys Hostel. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full max-h-[85vh] bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-white/10 text-white transition-all border border-white/10"
              >
                <X size={18} />
              </button>

              {/* Main Content */}
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden min-h-[300px]">
                {selectedMedia.type === "VIDEO" ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full max-h-[75vh] object-contain"
                  />
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt="Preview"
                    className="w-full h-full max-h-[75vh] object-contain"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
