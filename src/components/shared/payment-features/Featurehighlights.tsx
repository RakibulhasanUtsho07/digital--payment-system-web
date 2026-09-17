"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  FileCheck2,
  Send,
  ShieldCheck,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: Send,
    step: "01",
    title: "Clear wallet transfers",
    description:
      "Review the recipient, amount and transfer note before confirming a payment.",
    detail:
      "A guided review step keeps the most important information close to the final action.",
    tag: "Send & receive",
    tone: "bg-[#ded3ff]",
  },
  {
    icon: Clock3,
    step: "02",
    title: "Visible transaction status",
    description:
      "Completed, pending and failed states remain easy to identify in your activity history.",
    detail:
      "Clear timestamps and status labels make every wallet movement easier to follow.",
    tag: "Live status",
    tone: "bg-[#ccf3e5]",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Verification-aware controls",
    description:
      "KYC status and protected actions stay connected, so the next required step is clear.",
    detail:
      "Users can see whether verification is ready, pending or needs another action.",
    tag: "KYC journey",
    tone: "bg-[#ffe5be]",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Useful wallet insights",
    description:
      "Balance, recent activity and account controls sit together in one focused dashboard.",
    detail:
      "A readable overview helps people understand their wallet without jumping between screens.",
    tag: "Dashboard",
    tone: "bg-[#d4e5ff]",
  },
];

export function FeatureHighlights({
  rootRef,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  visible?: boolean;
}) {
  return (
    <section
      id="features"
      ref={rootRef}
      className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-14 sm:grid-cols-2 xl:gap-16">
          {features.map((feature, index) => (
            <FeatureVisual
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureVisual({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const Icon = feature.icon;

  const cardRef = useRef<HTMLElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const circle = circleRef.current;
    const content = contentRef.current;

    if (!card || !circle || !content) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(card, { clearProps: "all" });
      gsap.set(content.children, { clearProps: "all" });
      return;
    }

    const media = gsap.matchMedia();

    const context = gsap.context(() => {
      media.add("(min-width: 768px)", () => {
        gsap.fromTo(
          card,
          {
            autoAlpha: 0,
            y: 120,
            scale: 0.94,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 86%",
              toggleActions: "play none none reverse",
              invalidateOnRefresh: true,
            },
          }
        );

        gsap.fromTo(
          content.children,
          {
            autoAlpha: 0,
            y: 32,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 72%",
              toggleActions: "play none none reverse",
            },
          }
        );

        gsap.fromTo(
          circle,
          {
            rotate: -35,
            scale: 0.8,
          },
          {
            rotate: 120,
            scale: 1.12,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      media.add("(max-width: 767px)", () => {
        gsap.fromTo(
          card,
          {
            autoAlpha: 0,
            y: 55,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, card);

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      media.revert();
      context.revert();
    };
  }, [index]);

  return (
    <article
      ref={cardRef}
      className={`group relative min-h-[680px] overflow-hidden rounded-[34px] border border-[#120d25]/10 p-8 shadow-[0_30px_90px_rgba(18,13,37,.09)] transition-shadow duration-500 hover:shadow-[0_40px_120px_rgba(18,13,37,.18)] xl:p-11 ${feature.tone}`}
    >
      <div
        ref={circleRef}
        aria-hidden="true"
        className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[62px] border-white/35"
      />

      <div
        ref={contentRef}
        className="relative z-10 flex min-h-[590px] flex-col"
      >
        <div className="flex items-center justify-between">
          <motion.span
            whileHover={{
              rotate: -8,
              scale: 1.08,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 18,
            }}
            className="grid h-14 w-14 place-items-center rounded-[20px] bg-white/75 shadow-sm backdrop-blur"
          >
            <Icon className="h-6 w-6" />
          </motion.span>

          <span className="rounded-full border border-[#120d25]/10 bg-white/55 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
            {feature.tag}
          </span>
        </div>

        <div className="my-auto max-w-xl py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#120d25]/40">
            0{index + 1} / 04
          </p>

          <h3 className="mt-4 text-4xl font-black leading-[.98] tracking-[-0.055em] xl:text-5xl">
            {feature.title}
          </h3>

          <p className="mt-5 text-sm leading-7 text-[#120d25]/60 xl:text-base">
            {feature.detail}
          </p>
        </div>

        <MockupStack feature={feature} index={index} />
      </div>
    </article>
  );
}

function MockupStack({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontInnerRef = useRef<HTMLDivElement>(null);

  const Icon = feature.icon;

  useEffect(() => {
    const stack = stackRef.current;
    const back = backRef.current;
    const front = frontInnerRef.current;

    if (!stack || !back || !front) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const media = gsap.matchMedia();

    const context = gsap.context(() => {
      media.add("(min-width: 768px)", () => {
        const timeline = gsap.timeline({
          defaults: {
            ease: "none",
          },
          scrollTrigger: {
            trigger: stack,
            start: "top 92%",
            end: "bottom 12%",
            scrub: 0.85,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .fromTo(
            back,
            {
              y: 54,
              rotate: -2.5,
              scale: 0.96,
            },
            {
              y: -28,
              rotate: 0,
              scale: 1,
            },
            0
          )
          .fromTo(
            front,
            {
              y: 170,
              rotate: 5,
            },
            {
              y: -58,
              rotate: -1,
            },
            0
          );
      });

      media.add("(max-width: 767px)", () => {
        gsap.fromTo(
          front,
          {
            y: 95,
          },
          {
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: stack,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.65,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    }, stack);

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      media.revert();
      context.revert();
    };
  }, [index]);

  return (
    <div
      ref={stackRef}
      className="relative mt-2 h-[300px] sm:h-[340px]"
    >
      <div
        ref={backRef}
        className="absolute left-0 top-0 w-[72%] will-change-transform"
      >
        <WalletMockup active={index} />
      </div>

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        whileInView={{
          opacity: 1,
          scale: 1,
        }}
        viewport={{
          once: true,
          amount: 0.4,
        }}
        transition={{
          duration: 0.8,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{
          scale: 1.05,
          transition: {
            duration: 0.3,
          },
        }}
        className="absolute -bottom-4 -right-2 w-[46%]"
      >
        <div
          ref={frontInnerRef}
          className="rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_55px_rgba(18,13,37,.18)] backdrop-blur-xl will-change-transform"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#120d25]/5">
            <Icon className="h-5 w-5" />
          </span>

          <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#120d25]/45">
            {feature.tag}
          </p>

          <p className="mt-1 text-xs font-black leading-tight">
            Step {feature.step}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function WalletMockup({ active }: { active: number }) {
  if (active === 0) {
    return (
      <MockupShell label="Transfer review">
        <div className="grid grid-cols-2 gap-3">
          <MiniField label="Recipient" value="Nusrat Jahan" />

          <MiniField
            label="Amount"
            value="BDT 1,250"
            align="right"
          />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#120d25] p-4 text-white">
          <span className="text-xs font-bold">
            Ready to confirm
          </span>

          <ArrowRight className="h-4 w-4" />
        </div>
      </MockupShell>
    );
  }

  if (active === 1) {
    const statuses = [
      {
        status: "Completed",
        amount: "4,500",
      },
      {
        status: "Pending",
        amount: "1,250",
      },
      {
        status: "Completed",
        amount: "780",
      },
    ];

    return (
      <MockupShell label="Recent activity">
        {statuses.map((item, statusIndex) => (
          <div
            key={`${item.status}-${statusIndex}`}
            className="flex items-center justify-between border-b border-[#120d25]/10 py-2.5 last:border-0"
          >
            <span className="flex items-center gap-2 text-xs font-bold">
              <span
                className={`h-2 w-2 rounded-full ${
                  item.status === "Pending"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />

              {item.status}
            </span>

            <span className="text-xs font-black">
              BDT {item.amount}
            </span>
          </div>
        ))}
      </MockupShell>
    );
  }

  if (active === 2) {
    return (
      <MockupShell label="Identity verification">
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <FileCheck2 className="h-5 w-5" />
          </span>

          <div>
            <p className="text-sm font-black">
              Documents submitted
            </p>

            <p className="text-[10px] text-[#120d25]/45">
              Review is currently pending
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/60">
          <div className="h-full w-[68%] rounded-full bg-amber-400" />
        </div>
      </MockupShell>
    );
  }

  return (
    <MockupShell label="Wallet overview">
      <div className="flex h-24 items-end gap-2">
        {[38, 62, 45, 76, 54, 92, 70].map(
          (height, barIndex) => (
            <span
              key={`${height}-${barIndex}`}
              style={{
                height: `${height}%`,
              }}
              className="flex-1 rounded-t-lg bg-violet-600/75"
            />
          )
        )}
      </div>
    </MockupShell>
  );
}

function MockupShell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_60px_rgba(18,13,37,.14)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[#120d25]/40">
        <span>{label}</span>

        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.14)]" />
      </div>

      {children}
    </div>
  );
}

function MiniField({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`rounded-2xl bg-white/70 p-4 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      <p className="text-[10px] text-[#120d25]/45">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>
    </div>
  );
}