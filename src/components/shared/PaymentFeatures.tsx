

// "use client"

// import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
// import {
//   Zap,
//   ShieldCheck,
//   Globe2,
//   BarChart3,
//   Smartphone,
//   ArrowRight,
//   CheckCircle2,
//   Users,
//   CreditCard,
//   Building2,
//   HelpCircle,
//   Plus,
//   ArrowUpRight,
//   type LucideIcon,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";

// /* ---------------------------------------------------------
//    Types
// --------------------------------------------------------- */

// interface Feature {
//   icon: LucideIcon;
//   title: string;
//   description: string;
//   tag: string;
// }

// interface Stat {
//   icon: LucideIcon;
//   value: string;
//   label: string;
// }

// interface Faq {
//   q: string;
//   a: string;
// }

// interface Transaction {
//   name: string;
//   amount: string;
//   to: string;
//   status: string;
// }

// /* ---------------------------------------------------------
//    Small utility hooks — no extra libraries, just IntersectionObserver
//    + requestAnimationFrame, kept local so the component stays drop-in.
// --------------------------------------------------------- */

// function useInView<T extends HTMLElement>(
//   options: IntersectionObserverInit = { threshold: 0.2 }
// ): [React.RefObject<T>, boolean] {
//   const ref = useRef<T>(null);
//   const [inView, setInView] = useState(false);

//   useEffect(() => {
//     const node = ref.current;
//     if (!node) return;
//     const observer = new IntersectionObserver(([entry]) => {
//       if (entry.isIntersecting) {
//         setInView(true);
//         observer.disconnect();
//       }
//     }, options);
//     observer.observe(node);
//     return () => observer.disconnect();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return [ref, inView];
// }

// function useCountUp(target: number, start: boolean, duration = 1400): number {
//   const [value, setValue] = useState(0);
//   const raf = useRef<number | null>(null);

//   useEffect(() => {
//     if (!start) return;
//     const startTime = performance.now();
//     const tick = (now: number) => {
//       const progress = Math.min((now - startTime) / duration, 1);
//       const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
//       setValue(target * eased);
//       if (progress < 1) raf.current = requestAnimationFrame(tick);
//     };
//     raf.current = requestAnimationFrame(tick);
//     return () => {
//       if (raf.current) cancelAnimationFrame(raf.current);
//     };
//   }, [start, target, duration]);

//   return value;
// }

// function formatStat(raw: string, value: number): string {
//   if (raw.startsWith("$")) return `$${value.toFixed(1)}B+`;
//   if (raw.includes("K")) return `${Math.round(value)}K+`;
//   if (raw.includes("M")) return `${value.toFixed(1)}M+`;
//   return `${Math.round(value)}+`;
// }

// function parseStatTarget(raw: string): number {
//   const match = raw.match(/[\d.]+/);
//   return match ? parseFloat(match[0]) : 0;
// }

// /* ---------------------------------------------------------
//    Global styles — keyframes shared across the section
// --------------------------------------------------------- */

// function SectionStyles() {
//   return (
//     <style>{`
//       @keyframes fadeUp {
//         from { opacity: 0; transform: translateY(24px); }
//         to { opacity: 1; transform: translateY(0); }
//       }
//       @keyframes floatGlow {
//         0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
//         50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
//       }
//       @keyframes tickerScroll {
//         from { transform: translateX(0); }
//         to { transform: translateX(-50%); }
//       }
//       @keyframes pulseRing {
//         0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45); }
//         70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
//         100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
//       }
//       @keyframes shimmerBar {
//         0% { transform: translateX(-100%); }
//         100% { transform: translateX(220%); }
//       }
//       @keyframes iconPop {
//         0% { transform: scale(1) rotate(0deg); }
//         45% { transform: scale(1.18) rotate(-8deg); }
//         100% { transform: scale(1.1) rotate(0deg); }
//       }
//       @keyframes borderSweep {
//         0% { background-position: 0% 50%; }
//         100% { background-position: 200% 50%; }
//       }
//       @keyframes swipeInLeft {
//         0% { opacity: 0; transform: translateX(-56px) translateY(28px) rotate(-4deg) scale(0.92); filter: blur(6px); }
//         60% { opacity: 1; filter: blur(0); }
//         100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0deg) scale(1); filter: blur(0); }
//       }
//       @keyframes swipeInRight {
//         0% { opacity: 0; transform: translateX(56px) translateY(28px) rotate(4deg) scale(0.92); filter: blur(6px); }
//         60% { opacity: 1; filter: blur(0); }
//         100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0deg) scale(1); filter: blur(0); }
//       }
//       .card-swipe {
//         opacity: 0;
//       }
//       .card-swipe.swipe-left.in {
//         animation: swipeInLeft 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//       }
//       .card-swipe.swipe-right.in {
//         animation: swipeInRight 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//       }
//       .ticker-track { animation: tickerScroll 28s linear infinite; }
//       .ticker-track:hover { animation-play-state: paused; }
//       .status-dot { animation: pulseRing 2s infinite; }
//       .reveal {
//         opacity: 0;
//         transform: translateY(24px);
//         transition: opacity 0.6s ease, transform 0.6s ease;
//       }
//       .reveal.in { opacity: 1; transform: translateY(0); }
//       .tilt-card {
//         transition: transform 0.25s ease, box-shadow 0.3s ease, border-color 0.3s ease;
//         transform-style: preserve-3d;
//         will-change: transform;
//         position: relative;
//       }
//       .tilt-card::before {
//         content: "";
//         position: absolute;
//         inset: -1px;
//         border-radius: inherit;
//         padding: 1px;
//         background: linear-gradient(120deg, transparent, var(--primary), transparent);
//         background-size: 200% 100%;
//         -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//         -webkit-mask-composite: xor;
//         mask-composite: exclude;
//         opacity: 0;
//         transition: opacity 0.3s ease;
//         pointer-events: none;
//       }
//       .tilt-card:hover::before {
//         opacity: 1;
//         animation: borderSweep 2.2s linear infinite;
//       }
//       .card-spotlight {
//         position: absolute;
//         inset: 0;
//         border-radius: inherit;
//         opacity: 0;
//         transition: opacity 0.3s ease;
//         background: radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), rgba(var(--primary-rgb, 99 102 241) / 0.14), transparent 70%);
//         pointer-events: none;
//       }
//       .tilt-card:hover .card-spotlight { opacity: 1; }
//       .icon-pop { animation: iconPop 0.5s ease forwards; }
//       .shine {
//         position: absolute;
//         top: 0;
//         left: -60%;
//         width: 40%;
//         height: 100%;
//         background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
//         transform: skewX(-20deg);
//         transition: left 0.7s ease;
//         pointer-events: none;
//       }
//       .tilt-card:hover .shine { left: 130%; }
//     `}</style>
//   );
// }

// export default function PaymentFeatures() {
//   const features: Feature[] = [
//     {
//       icon: Zap,
//       title: "Instant Money Settlement",
//       description:
//         "Transfer money globally with zero latency. Direct settlement into local bank accounts within seconds.",
//       tag: "Real-time",
//     },
//     {
//       icon: ShieldCheck,
//       title: "Bank-Grade Encryption",
//       description:
//         "256-bit SSL encryption and AI fraud detection keep every single micro-transaction 100% secure.",
//       tag: "PCI-DSS Level 1",
//     },
//     {
//       icon: Globe2,
//       title: "Multi-Currency Gateway",
//       description:
//         "Accept 130+ currencies with real-time exchange rates and transparent low transaction fees.",
//       tag: "Global Access",
//     },
//     {
//       icon: BarChart3,
//       title: "Smart Business Analytics",
//       description:
//         "Comprehensive financial insights, dynamic graphs, and downloadable monthly revenue reports.",
//       tag: "AI Powered",
//     },
//   ];

//   const highlights: string[] = [
//     "Zero hidden maintenance fees",
//     "Instant SMS & Email payout notifications",
//     "24/7 Priority customer support",
//     "Seamless API integration for web & mobile",
//   ];

//   const stats: Stat[] = [
//     { icon: Users, value: "2M+", label: "Active Users" },
//     { icon: CreditCard, value: "$5B+", label: "Processed Annually" },
//     { icon: Globe2, value: "120+", label: "Countries Supported" },
//     { icon: Building2, value: "10K+", label: "Partner Merchants" },
//   ];

//   const faqs: Faq[] = [
//     {
//       q: "How fast are money transfers?",
//       a: "Transfers between system wallets are instantaneous. Bank deposits typically take under 2 minutes.",
//     },
//     {
//       q: "Are my financial details secure?",
//       a: "Yes. We use end-to-end 256-bit SSL encryption and strict PCI-DSS compliance standards.",
//     },
//     {
//       q: "What are the transaction fees?",
//       a: "Personal transfers are 100% free. Merchant processing fees start at a low flat rate of 1.2% per transaction.",
//     },
//     {
//       q: "Can I integrate this into my own app?",
//       a: "Yes. Our REST and webhook-based SDKs drop into web and mobile apps in under 5 minutes — no PCI infrastructure required on your end.",
//     },
//   ];

//   const liveTransactions: Transaction[] = [
//     { name: "Rafiq H.", amount: "$420.00", to: "Dhaka Bank", status: "Settled" },
//     { name: "Nadia S.", amount: "€1,180.50", to: "Deutsche Bank", status: "Settled" },
//     { name: "James K.", amount: "$75.20", to: "Chase", status: "Settled" },
//     { name: "Aiko T.", amount: "¥92,000", to: "MUFG", status: "Settled" },
//     { name: "Fatima Z.", amount: "£340.00", to: "Barclays", status: "Settled" },
//     { name: "Lucas M.", amount: "$2,050.00", to: "Nubank", status: "Settled" },
//     { name: "Priya R.", amount: "₹18,400", to: "HDFC", status: "Settled" },
//     { name: "Omar A.", amount: "$610.75", to: "Emirates NBD", status: "Settled" },
//   ];

//   const [featuresRef, featuresInView] = useInView<HTMLDivElement>({ threshold: 0.15 });
//   const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
//   const [bannerRef, bannerInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
//   const [faqRef, faqInView] = useInView<HTMLDivElement>({ threshold: 0.15 });
//   const [openFaq, setOpenFaq] = useState<number>(0);

//   return (
//     <section className="py-24 bg-background relative overflow-hidden space-y-24">
//       <SectionStyles />

//       {/* Background Glow Effect */}
//       <div
//         className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
//         style={{ animation: "floatGlow 8s ease-in-out infinite" }}
//       />

//       <div className="max-w-7xl mx-auto px-6 space-y-24">
//         {/* --- 1. Main Features Grid --- */}
//         <div ref={featuresRef}>
//           <div
//             className={`text-center max-w-3xl mx-auto mb-16 space-y-4 reveal ${featuresInView ? "in" : ""}`}
//           >
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
//               <Zap className="w-3.5 h-3.5" />
//               Next-Gen Payment Experience
//             </div>

//             <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
//               Designed for{" "}
//               <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
//                 lightning-fast
//               </span>{" "}
//               transactions
//             </h2>

//             <p className="text-muted-foreground text-base md:text-lg">
//               Empower your digital finance with cutting-edge tools built for seamless payments, robust
//               security, and global scalability.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {features.map((feature, index) => (
//               <FeatureCard key={index} feature={feature} index={index} />
//             ))}
//           </div>
//         </div>

//         {/* --- 2. Live Stats Section --- */}
//         <div
//           ref={statsRef}
//           className={`grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 rounded-3xl bg-card/50 border border-border/80 backdrop-blur-sm reveal ${statsInView ? "in" : ""}`}
//         >
//           {stats.map((stat, idx) => (
//             <StatItem key={idx} stat={stat} start={statsInView} delay={idx * 120} />
//           ))}
//         </div>

//         {/* --- 3. Interactive Integration Banner --- */}
//         <div
//           ref={bannerRef}
//           className={`rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-8 md:p-12 relative overflow-hidden shadow-lg reveal ${bannerInView ? "in" : ""}`}
//         >
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
//             <div className="space-y-6">
//               <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
//                 <Smartphone className="w-4 h-4" />
//                 Modern Mobile & Web SDK
//               </div>

//               <h3 className="text-2xl md:text-3xl font-bold">
//                 Start accepting digital payments in under 5 minutes
//               </h3>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 {highlights.map((item, idx) => (
//                   <div key={idx} className="flex items-center gap-2.5 text-sm text-muted-foreground">
//                     <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
//                     <span>{item}</span>
//                   </div>
//                 ))}
//               </div>

//               <div className="pt-2 flex flex-wrap gap-4">
//                 <Button
//                   size="lg"
//                   className="rounded-xl font-semibold shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
//                 >
//                   Create Merchant Account
//                   <ArrowUpRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
//                 </Button>
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="rounded-xl font-semibold hover:-translate-y-0.5 transition-all duration-300"
//                 >
//                   View API Documentation
//                 </Button>
//               </div>
//             </div>

//             {/* Live transaction ticker — signature element */}
//             <div className="relative flex justify-center lg:justify-end">
//               <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-4">
//                 <div className="flex justify-between items-center">
//                   <span className="text-xs font-medium text-muted-foreground">Live Transactions</span>
//                   <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
//                     <span className="status-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                     Live
//                   </span>
//                 </div>

//                 <div className="overflow-hidden">
//                   <div className="ticker-track flex flex-col gap-3 w-max">
//                     {[...liveTransactions, ...liveTransactions].map((tx, i) => (
//                       <div
//                         key={i}
//                         className="flex items-center justify-between gap-6 text-sm border-b border-border/40 pb-3 last:border-none"
//                       >
//                         <div>
//                           <div className="font-semibold text-foreground">{tx.name}</div>
//                           <div className="text-xs text-muted-foreground">→ {tx.to}</div>
//                         </div>
//                         <div className="text-right">
//                           <div className="font-black text-foreground">{tx.amount}</div>
//                           <div className="text-[10px] font-semibold text-emerald-500">{tx.status}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
//                   <div className="h-full bg-primary w-3/4 rounded-full relative overflow-hidden">
//                     <span
//                       className="absolute inset-y-0 left-0 w-1/3 bg-white/40"
//                       style={{ animation: "shimmerBar 2.2s ease-in-out infinite" }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* --- 4. Frequently Asked Questions (FAQ) --- */}
//         <div ref={faqRef} className={`max-w-4xl mx-auto space-y-8 reveal ${faqInView ? "in" : ""}`}>
//           <div className="text-center space-y-2">
//             <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase">
//               <HelpCircle className="w-4 h-4" /> Got Questions?
//             </div>
//             <h3 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h3>
//           </div>

//           <div className="grid gap-4">
//             {faqs.map((faq, i) => {
//               const isOpen = openFaq === i;
//               return (
//                 <div
//                   key={i}
//                   className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${
//                     isOpen ? "border-primary/50 bg-card" : "border-border/80 bg-card"
//                   }`}
//                 >
//                   <button
//                     type="button"
//                     onClick={() => setOpenFaq(isOpen ? -1 : i)}
//                     className="w-full flex items-center justify-between gap-4 p-6 text-left"
//                     aria-expanded={isOpen}
//                   >
//                     <h4 className="font-bold text-base md:text-lg">{faq.q}</h4>
//                     <span
//                       className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border transition-all duration-300 ${
//                         isOpen
//                           ? "bg-primary text-primary-foreground rotate-45 border-primary"
//                           : "text-muted-foreground"
//                       }`}
//                     >
//                       <Plus className="w-4 h-4" />
//                     </span>
//                   </button>
//                   <div
//                     className="grid transition-all duration-300 ease-out"
//                     style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
//                   >
//                     <div className="overflow-hidden">
//                       <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// /* ---------------------------------------------------------
//    Feature card — this is where the extra animation lives:
//    - cursor-follow 3D tilt
//    - radial spotlight that tracks the cursor
//    - animated gradient border sweep on hover
//    - diagonal "shine" pass on hover
//    - icon pop/bounce on hover
// --------------------------------------------------------- */
// interface FeatureCardProps {
//   feature: Feature;
//   index: number;
// }

// function FeatureCard({ feature, index }: FeatureCardProps): ReactNode {
//   const [triggerRef, inView] = useInView<HTMLDivElement>({ threshold: 0.25, rootMargin: "-40px" });
//   const cardRef = useRef<HTMLDivElement>(null);
//   const [iconPop, setIconPop] = useState(false);
//   const Icon = feature.icon;
//   const direction = index % 2 === 0 ? "swipe-left" : "swipe-right";
//   const delay = index * 130;

//   const setRefs = useCallback(
//     (node: HTMLDivElement | null) => {
//       cardRef.current = node;
//       // useInView's ref is a RefObject we can safely assign to as well
//       (triggerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
//     },
//     [triggerRef]
//   );

//   const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
//     const card = cardRef.current;
//     if (!card) return;
//     const rect = card.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const rotateX = ((y - rect.height / 2) / rect.height) * -8;
//     const rotateY = ((x - rect.width / 2) / rect.width) * 8;
//     card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
//     card.style.setProperty("--x", `${(x / rect.width) * 100}%`);
//     card.style.setProperty("--y", `${(y / rect.height) * 100}%`);
//   }, []);

//   const handleMouseEnter = useCallback(() => {
//     setIconPop(true);
//   }, []);

//   const handleMouseLeave = useCallback(() => {
//     const card = cardRef.current;
//     if (!card) return;
//     card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
//     setIconPop(false);
//   }, []);

//   return (
//     <div
//       ref={setRefs}
//       onMouseMove={handleMouseMove}
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//       className={`tilt-card group relative p-8 rounded-3xl bg-card border border-border/80 hover:border-primary/50 shadow-sm hover:shadow-xl hover:shadow-primary/10 flex flex-col justify-between overflow-hidden card-swipe ${direction} ${
//         inView ? "in" : ""
//       }`}
//       style={{ animationDelay: inView ? `${delay}ms` : "0ms" }}
//     >
//       <span className="shine" />
//       <span className="card-spotlight" />

//       <div className="relative">
//         <div className="flex items-center justify-between mb-6">
//           <div
//             className={`w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 ${
//               iconPop ? "icon-pop" : ""
//             }`}
//           >
//             <Icon className="w-6 h-6" />
//           </div>
//           <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
//             {feature.tag}
//           </span>
//         </div>

//         <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
//           {feature.title}
//         </h3>

//         <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
//       </div>

//       <div className="relative mt-6 pt-4 border-t border-border/40 flex items-center gap-2 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
//         <span>Learn details</span>
//         <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
//       </div>
//     </div>
//   );
// }

// /* ---------------------------------------------------------
//    Stat item with count-up animation once scrolled into view.
// --------------------------------------------------------- */
// interface StatItemProps {
//   stat: Stat;
//   start: boolean;
//   delay: number;
// }

// function StatItem({ stat, start, delay }: StatItemProps): ReactNode {
//   const Icon = stat.icon;
//   const target = parseStatTarget(stat.value);
//   const animated = useCountUp(target, start, 1300);

//   return (
//     <div
//       className={`flex items-center gap-4 p-2 reveal ${start ? "in" : ""}`}
//       style={{ transitionDelay: start ? `${delay}ms` : "0ms" }}
//     >
//       <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
//         <Icon className="w-6 h-6" />
//       </div>
//       <div>
//         <div className="text-2xl md:text-3xl font-extrabold tabular-nums">
//           {formatStat(stat.value, animated)}
//         </div>
//         <div className="text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Zap,
  ShieldCheck,
  Globe2,
  BarChart3,
  Smartphone,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Users,
  CreditCard,
  Building2,
  HelpCircle,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------------------------------------------------
   Types
--------------------------------------------------------- */

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
}

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface Faq {
  q: string;
  a: string;
}

interface TxTemplate {
  name: string;
  to: string;
  currency: string;
  min: number;
  max: number;
  decimals: number;
}

interface Tx {
  id: number;
  name: string;
  amount: string;
  to: string;
  time: number; // ms epoch
  leaving?: boolean;
}

/* ---------------------------------------------------------
   Small utility hooks
--------------------------------------------------------- */

function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.2 }
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

function useCountUp(target: number, start: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [start, target, duration]);

  return value;
}

function formatStat(raw: string, value: number): string {
  if (raw.startsWith("$")) return `$${value.toFixed(1)}B+`;
  if (raw.includes("K")) return `${Math.round(value)}K+`;
  if (raw.includes("M")) return `${value.toFixed(1)}M+`;
  return `${Math.round(value)}+`;
}

function parseStatTarget(raw: string): number {
  const match = raw.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/* ---------------------------------------------------------
   Global styles
--------------------------------------------------------- */

function SectionStyles() {
  return (
    <style>{`
      @keyframes floatGlow {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
        50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
      }
      @keyframes pulseRing {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45); }
        70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      @keyframes shimmerBar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(220%); }
      }
      @keyframes stepProgress {
        from { width: 0%; }
        to { width: 100%; }
      }
      @keyframes iconPop {
        0% { transform: scale(0.7) rotate(-8deg); opacity: 0; }
        60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes txSlideIn {
        from { opacity: 0; transform: translateY(-14px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes txSlideOut {
        from { opacity: 1; max-height: 64px; margin-bottom: 0.75rem; transform: translateY(0) scale(1); }
        to { opacity: 0; max-height: 0; margin-bottom: 0; transform: translateY(8px) scale(0.97); }
      }
      @keyframes txFreshFlash {
        0% { background-color: rgba(16, 185, 129, 0.14); }
        100% { background-color: rgba(16, 185, 129, 0); }
      }
      @keyframes dotBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .status-dot { animation: pulseRing 2s infinite; }
      .reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .reveal.in { opacity: 1; transform: translateY(0); }
      .step-progress-fill {
        animation: stepProgress linear forwards;
      }
      .slide-panel-item {
        transition: transform 0.65s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.5s ease;
      }
      .icon-pop {
        animation: iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .tx-row {
        animation: txSlideIn 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), txFreshFlash 1.8s ease-out;
        border-radius: 0.75rem;
      }
      .tx-row.tx-leaving {
        animation: txSlideOut 0.35s ease forwards;
        overflow: hidden;
      }
      .live-dot {
        animation: dotBlink 1.6s ease-in-out infinite;
      }
      .stat-card {
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease, border-color 0.35s ease;
      }
      .stat-card:hover {
        transform: translateY(-4px);
        border-color: hsl(var(--primary) / 0.35);
        box-shadow: 0 12px 28px -14px rgba(0,0,0,0.25);
      }
      .stat-card:hover .stat-icon {
        transform: scale(1.1) rotate(-6deg);
      }
      .stat-icon {
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @media (prefers-reduced-motion: reduce) {
        .reveal, .tx-row, .tx-row.tx-leaving, .icon-pop, .status-dot, .live-dot, .stat-card, .stat-icon, .slide-panel-item {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}

/* ---------------------------------------------------------
   Live transaction data pool — realistic name/bank/currency
   combinations so generated rows never look random-garbled.
--------------------------------------------------------- */

const TX_TEMPLATES: TxTemplate[] = [
  { name: "Rafiq H.", to: "Dhaka Bank", currency: "$", min: 40, max: 900, decimals: 2 },
  { name: "Nadia S.", to: "Deutsche Bank", currency: "€", min: 60, max: 2200, decimals: 2 },
  { name: "James K.", to: "Chase", currency: "$", min: 20, max: 500, decimals: 2 },
  { name: "Aiko T.", to: "MUFG", currency: "¥", min: 3000, max: 150000, decimals: 0 },
  { name: "Fatima Z.", to: "Barclays", currency: "£", min: 30, max: 700, decimals: 2 },
  { name: "Lucas M.", to: "Nubank", currency: "$", min: 100, max: 3000, decimals: 2 },
  { name: "Priya R.", to: "HDFC", currency: "₹", min: 500, max: 40000, decimals: 0 },
  { name: "Omar A.", to: "Emirates NBD", currency: "$", min: 80, max: 1800, decimals: 2 },
  { name: "Tanvir I.", to: "BRAC Bank", currency: "৳", min: 1000, max: 60000, decimals: 0 },
  { name: "Sofia R.", to: "BBVA", currency: "€", min: 25, max: 950, decimals: 2 },
  { name: "Wei C.", to: "ICBC", currency: "¥", min: 200, max: 12000, decimals: 0 },
  { name: "Grace O.", to: "Standard Bank", currency: "$", min: 15, max: 400, decimals: 2 },
];

function randomAmount(t: TxTemplate): string {
  const value = t.min + Math.random() * (t.max - t.min);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: t.decimals,
    maximumFractionDigits: t.decimals,
  });
  return `${t.currency}${formatted}`;
}

function makeTx(id: number): Tx {
  const t = TX_TEMPLATES[Math.floor(Math.random() * TX_TEMPLATES.length)];
  return { id, name: t.name, amount: randomAmount(t), to: t.to, time: Date.now() };
}

function timeAgoLabel(time: number, nowTick: number): string {
  const elapsed = Math.max(0, Math.round((nowTick - time) / 1000));
  if (elapsed < 2) return "Just now";
  if (elapsed < 60) return `${elapsed}s ago`;
  return `${Math.floor(elapsed / 60)}m ago`;
}

/* ---------------------------------------------------------
   Live transaction feed — self-updating, feels like a real
   payment stream: a new row slides in every ~2.5–4s, older
   rows animate out once the list is full, and each visible
   row's timestamp ticks upward in real time.
--------------------------------------------------------- */

function LiveTransactionFeed() {
  const MAX_VISIBLE = 5;
  const idRef = useRef(1);

  // IMPORTANT: no Math.random()/Date.now() in initial state. Server render and
  // the client's first render must produce identical markup, or React throws a
  // hydration mismatch. So we start empty/static and only fill in randomized,
  // time-based data inside a useEffect — which runs client-only, after hydration.
  const [txs, setTxs] = useState<Tx[]>([]);
  const [nowTick, setNowTick] = useState(0);
  const [volume, setVolume] = useState(482_310);
  const [mounted, setMounted] = useState(false);

  // Seed the feed once we're safely on the client.
  useEffect(() => {
    const initial = Array.from({ length: MAX_VISIBLE }, (_, i) => {
      const tx = makeTx(idRef.current++);
      return { ...tx, time: Date.now() - i * 6000 };
    });
    setTxs(initial);
    setNowTick(Date.now());
    setMounted(true);
  }, []);

  // Add a fresh transaction on an irregular interval, like a real feed.
  useEffect(() => {
    if (!mounted) return;
    let timeout: number;
    const scheduleNext = () => {
      const delay = 2200 + Math.random() * 2000;
      timeout = window.setTimeout(() => {
        setTxs((prev) => {
          const next = makeTx(idRef.current++);
          const withNew = [next, ...prev];
          if (withNew.length > MAX_VISIBLE) {
            // mark the overflow row as leaving instead of instantly cutting it
            const overflowIndex = MAX_VISIBLE;
            return withNew.map((tx, i) => (i === overflowIndex ? { ...tx, leaving: true } : tx));
          }
          return withNew;
        });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => window.clearTimeout(timeout);
  }, [mounted]);

  // Once a row's leave animation finishes, actually drop it from state.
  useEffect(() => {
    const leaver = txs.find((tx) => tx.leaving);
    if (!leaver) return;
    const t = window.setTimeout(() => {
      setTxs((prev) => prev.filter((tx) => tx.id !== leaver.id));
    }, 360);
    return () => window.clearTimeout(t);
  }, [txs]);

  // Tick the clock every second so "Xs ago" labels stay accurate.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Keep the "processed today" figure gently climbing so the card feels alive
  // even between new transaction rows.
  useEffect(() => {
    const id = window.setInterval(() => {
      setVolume((v) => v + Math.round(80 + Math.random() * 420));
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted-foreground">Live Transactions</span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <span className="live-dot status-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div aria-live="polite" className="flex flex-col">
        {!mounted
          ? Array.from({ length: MAX_VISIBLE }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center justify-between gap-6 text-sm border-b border-border/40 px-2 py-2.5 mb-1 last:border-none animate-pulse"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-muted" />
                  <div className="h-2.5 w-24 rounded bg-muted" />
                </div>
                <div className="text-right shrink-0 space-y-1.5">
                  <div className="h-3.5 w-16 rounded bg-muted ml-auto" />
                  <div className="h-2.5 w-12 rounded bg-muted ml-auto" />
                </div>
              </div>
            ))
          : txs.map((tx) => (
              <div
                key={tx.id}
                className={`tx-row ${tx.leaving ? "tx-leaving" : ""} flex items-center justify-between gap-6 text-sm border-b border-border/40 px-2 py-2.5 mb-1 last:border-none`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{tx.name}</div>
                  <div className="text-xs text-muted-foreground truncate">→ {tx.to}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-foreground tabular-nums">{tx.amount}</div>
                  <div className="text-[10px] font-semibold text-emerald-500">
                    {timeAgoLabel(tx.time, nowTick)}
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="pt-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Processed today</span>
        <span className="font-bold text-foreground tabular-nums">
          ${volume.toLocaleString("en-US")}
        </span>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
        <div className="h-full bg-primary w-3/4 rounded-full relative overflow-hidden">
          <span
            className="absolute inset-y-0 left-0 w-1/3 bg-white/40"
            style={{ animation: "shimmerBar 2.2s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PaymentFeatures() {
  const features: Feature[] = [
    {
      icon: Zap,
      title: "Instant Money Settlement",
      description:
        "Transfer money globally with zero latency. Direct settlement into local bank accounts within seconds.",
      tag: "Real-time",
    },
    {
      icon: ShieldCheck,
      title: "Bank-Grade Encryption",
      description:
        "256-bit SSL encryption and AI fraud detection keep every single micro-transaction 100% secure.",
      tag: "PCI-DSS Level 1",
    },
    {
      icon: Globe2,
      title: "Multi-Currency Gateway",
      description:
        "Accept 130+ currencies with real-time exchange rates and transparent low transaction fees.",
      tag: "Global Access",
    },
    {
      icon: BarChart3,
      title: "Smart Business Analytics",
      description:
        "Comprehensive financial insights, dynamic graphs, and downloadable monthly revenue reports.",
      tag: "AI Powered",
    },
  ];

  const highlights: string[] = [
    "Zero hidden maintenance fees",
    "Instant SMS & Email payout notifications",
    "24/7 Priority customer support",
    "Seamless API integration for web & mobile",
  ];

  const stats: Stat[] = [
    { icon: Users, value: "2M+", label: "Active Users" },
    { icon: CreditCard, value: "$5B+", label: "Processed Annually" },
    { icon: Globe2, value: "120+", label: "Countries Supported" },
    { icon: Building2, value: "10K+", label: "Partner Merchants" },
  ];

  const faqs: Faq[] = [
    {
      q: "How fast are money transfers?",
      a: "Transfers between system wallets are instantaneous. Bank deposits typically take under 2 minutes.",
    },
    {
      q: "Are my financial details secure?",
      a: "Yes. We use end-to-end 256-bit SSL encryption and strict PCI-DSS compliance standards.",
    },
    {
      q: "What are the transaction fees?",
      a: "Personal transfers are 100% free. Merchant processing fees start at a low flat rate of 1.2% per transaction.",
    },
    {
      q: "Can I integrate this into my own app?",
      a: "Yes. Our REST and webhook-based SDKs drop into web and mobile apps in under 5 minutes — no PCI infrastructure required on your end.",
    },
  ];

  const [featuresRef, featuresInView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [bannerRef, bannerInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [faqRef, faqInView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <section className="py-24 bg-background relative overflow-hidden space-y-24">
      <SectionStyles />

      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
        style={{ animation: "floatGlow 8s ease-in-out infinite" }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-24">
        {/* --- 1. Main Features: step list + sliding panel --- */}
        <div ref={featuresRef}>
          <div
            className={`text-center max-w-3xl mx-auto mb-16 space-y-4 reveal ${featuresInView ? "in" : ""}`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Next-Gen Payment Experience
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Designed for{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                lightning-fast
              </span>{" "}
              transactions
            </h2>

            <p className="text-muted-foreground text-base md:text-lg">
              Empower your digital finance with cutting-edge tools built for seamless payments, robust
              security, and global scalability.
            </p>
          </div>

          <FeatureStepper features={features} visible={featuresInView} />
        </div>

        {/* --- 2. Live Stats Section --- */}
        <div
          ref={statsRef}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 rounded-3xl bg-card/50 border border-border/80 backdrop-blur-sm reveal ${statsInView ? "in" : ""}`}
        >
          {stats.map((stat, idx) => (
            <StatItem key={idx} stat={stat} start={statsInView} delay={idx * 120} />
          ))}
        </div>

        {/* --- 3. Interactive Integration Banner --- */}
        <div
          ref={bannerRef}
          className={`rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-8 md:p-12 relative overflow-hidden shadow-lg reveal ${bannerInView ? "in" : ""}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Smartphone className="w-4 h-4" />
                Modern Mobile & Web SDK
              </div>

              <h3 className="text-2xl md:text-3xl font-bold">
                Start accepting digital payments in under 5 minutes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="rounded-xl font-semibold shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  Create Merchant Account
                  <ArrowUpRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl font-semibold hover:-translate-y-0.5 transition-all duration-300"
                >
                  View API Documentation
                </Button>
              </div>
            </div>

            {/* Live transaction feed */}
            <div className="relative flex justify-center lg:justify-end">
              <LiveTransactionFeed />
            </div>
          </div>
        </div>

        {/* --- 4. Frequently Asked Questions (FAQ) --- */}
        <div ref={faqRef} className={`max-w-4xl mx-auto space-y-8 reveal ${faqInView ? "in" : ""}`}>
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase">
              <HelpCircle className="w-4 h-4" /> Got Questions?
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h3>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${
                    isOpen ? "border-primary/50 bg-card" : "border-border/80 bg-card"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <h4 className="font-bold text-base md:text-lg">{faq.q}</h4>
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border transition-all duration-300 ${
                        isOpen
                          ? "bg-primary text-primary-foreground rotate-45 border-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   FeatureStepper — left: clickable step list (auto-advances
   on a timer, with a progress bar under the active step).
   right: a horizontal sliding "filmstrip" panel — each
   feature sits at translateX = (index - active) * 100%, so
   the active one is centered, the next one waits just off
   the right edge, and the previous one slides fully out to
   the left.
--------------------------------------------------------- */
interface FeatureStepperProps {
  features: Feature[];
  visible: boolean;
}

function FeatureStepper({ features, visible }: FeatureStepperProps): ReactNode {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const AUTO_MS = 4200;

  useEffect(() => {
    if (paused || !visible) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % features.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, visible, features.length]);

  const handleSelect = (i: number) => {
    setActive(i);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 8000);
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center reveal ${visible ? "in" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left: step list */}
      <div className="space-y-3 order-2 md:order-1">
        {features.map((feature, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={`relative w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl text-left overflow-hidden transition-all duration-500 ${
                isActive
                  ? "bg-foreground text-background shadow-lg scale-[1.02]"
                  : "bg-card border border-border/70 text-foreground hover:border-primary/40"
              }`}
            >
              <div>
                <div className={`text-[11px] font-semibold mb-1 ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                  Step 0{i + 1}
                </div>
                <div className="font-semibold text-sm md:text-base">{feature.title}</div>
              </div>

              {isActive ? (
                <ArrowRight className="w-4 h-4 shrink-0" />
              ) : (
                <ArrowUpRight className="w-4 h-4 shrink-0 text-muted-foreground" />
              )}

              {isActive && !paused && (
                <span
                  key={active}
                  className="step-progress-fill absolute left-0 bottom-0 h-0.5 bg-background/70"
                  style={{ animationDuration: `${AUTO_MS}ms` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: sliding filmstrip panel */}
      <div className="order-1 md:order-2 relative h-[320px] sm:h-[360px] rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const offset = (i - active) * 100;
          return (
            <div
              key={i}
              className="slide-panel-item absolute inset-0 p-8 md:p-10 flex flex-col justify-between"
              style={{
                transform: `translateX(${offset}%)`,
                opacity: i === active ? 1 : 0,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  key={i === active ? `active-${active}` : i}
                  className={`w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ${
                    i === active ? "icon-pop" : ""
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
                  {feature.tag}
                </span>
              </div>

              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* Dot indicators bottom-right of panel */}
        <div className="absolute bottom-5 right-6 flex items-center gap-1.5">
          {features.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                i === active ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Stat item with count-up animation once scrolled into view,
   plus a subtle hover lift so the row invites interaction.
--------------------------------------------------------- */
interface StatItemProps {
  stat: Stat;
  start: boolean;
  delay: number;
}

function StatItem({ stat, start, delay }: StatItemProps): ReactNode {
  const Icon = stat.icon;
  const target = parseStatTarget(stat.value);
  const animated = useCountUp(target, start, 1300);

  return (
    <div
      className={`stat-card flex items-center gap-4 p-3 rounded-2xl border border-transparent reveal ${start ? "in" : ""}`}
      style={{ transitionDelay: start ? `${delay}ms` : "0ms" }}
    >
      <div className="stat-icon w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-extrabold tabular-nums">
          {formatStat(stat.value, animated)}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</div>
      </div>
    </div>
  );
}
