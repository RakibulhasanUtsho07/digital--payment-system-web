"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  Boxes,
  Building2,
  Cpu,
  Globe2,
  Landmark,
  Layers3,
  ShoppingBag,
  Sparkles,
  Store,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 3D "wrap around a sphere" tuning — safe to tweak these three numbers
const CURVE_MAX_ROTATION = 42; // degrees a card turns at the far edge
const CURVE_MAX_DEPTH = 240; // px a card sinks back at the far edge
const CURVE_MIN_SCALE = 0.82; // scale of a card at the far edge

type Brand = {
  name: string;
  category: string;
  icon: LucideIcon;
};

type CardMeta = {
  el: HTMLElement;
  offsetLeft: number;
  width: number;
};

const firstRowBrands: Brand[] = [
  { name: "Northstar", category: "Digital banking", icon: Building2 },
  { name: "Lumina", category: "Creative commerce", icon: Sparkles },
  { name: "Vertex", category: "Payment automation", icon: Workflow },
  { name: "Marketly", category: "Online marketplace", icon: ShoppingBag },
  { name: "Nexora", category: "Team finance", icon: UsersRound },
  { name: "Shopora", category: "Retail platform", icon: Store },
];

const secondRowBrands: Brand[] = [
  { name: "Atlas Pay", category: "Global transfers", icon: Globe2 },
  { name: "Civica", category: "Business accounts", icon: Landmark },
  { name: "Stacklane", category: "Finance operations", icon: Layers3 },
  { name: "Corebit", category: "Fintech infrastructure", icon: Cpu },
  { name: "Modular", category: "Merchant tools", icon: Boxes },
  { name: "Orbit Shop", category: "Connected commerce", icon: Store },
];

export function CompanyMarquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const firstRowRef = useRef<HTMLDivElement>(null);
  const secondRowRef = useRef<HTMLDivElement>(null);
  const firstTrackRef = useRef<HTMLDivElement>(null);
  const secondTrackRef = useRef<HTMLDivElement>(null);
  const pointerGlowRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const firstRow = firstRowRef.current;
    const secondRow = secondRowRef.current;
    const firstTrack = firstTrackRef.current;
    const secondTrack = secondTrackRef.current;
    const pointerGlow = pointerGlowRef.current;
    const sweep = sweepRef.current;

    if (
      !section ||
      !firstRow ||
      !secondRow ||
      !firstTrack ||
      !secondTrack ||
      !pointerGlow ||
      !sweep
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      gsap.set([firstRow, secondRow], {
        autoAlpha: 1,
        clearProps: "transform",
      });

      return;
    }

    let firstMarquee: gsap.core.Tween | null = null;
    let secondMarquee: gsap.core.Tween | null = null;
    let firstRowCards: CardMeta[] = [];
    let secondRowCards: CardMeta[] = [];
    let firstRowWidth = 0;
    let secondRowWidth = 0;
    let rebuildFrame = 0;
    let isHovering = false;

    const context = gsap.context(() => {
      gsap.set(pointerGlow, {
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 0,
      });

      const revealTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 84%",
          toggleActions: "play none none reverse",
        },
      });

      revealTimeline
        .fromTo(
          firstRow,
          { autoAlpha: 0, x: 80, y: 30 },
          { autoAlpha: 1, x: 0, y: 0, duration: 1, ease: "power3.out" }
        )
        .fromTo(
          secondRow,
          { autoAlpha: 0, x: -80, y: 30 },
          { autoAlpha: 1, x: 0, y: 0, duration: 1, ease: "power3.out" },
          "-=0.7"
        );

      gsap.fromTo(
        sweep,
        { xPercent: -130, rotate: -8 },
        {
          xPercent: 160,
          rotate: -8,
          duration: 9,
          repeat: -1,
          repeatDelay: 2,
          ease: "power1.inOut",
        }
      );

      const floatingCards = gsap.utils.toArray<HTMLElement>(
        "[data-marquee-float]",
        section
      );

      floatingCards.forEach((card, index) => {
        gsap.to(card, {
          y: index % 2 === 0 ? -5 : 5,
          duration: 2.4 + (index % 4) * 0.22,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: (index % 6) * 0.1,
        });
      });

      const buildMarquee = (
        track: HTMLDivElement,
        direction: "left" | "right",
        speed: number
      ) => {
        const group = track.querySelector<HTMLElement>(
          "[data-marquee-group]"
        );

        if (!group) return null;

        const distance = group.getBoundingClientRect().width;

        if (distance <= 0) return null;

        const start = direction === "left" ? 0 : -distance;
        const end = direction === "left" ? -distance : 0;

        gsap.set(track, { x: start });

        return gsap.to(track, {
          x: end,
          duration: distance / speed,
          repeat: -1,
          ease: "none",
        });
      };

      const collectCardMeta = (track: HTMLDivElement): CardMeta[] => {
        const cards = Array.from(
          track.querySelectorAll<HTMLElement>("[data-marquee-float]")
        );

        gsap.set(cards, { transformPerspective: 1400, force3D: true });

        return cards.map((el) => ({
          el,
          offsetLeft: el.offsetLeft,
          width: el.offsetWidth,
        }));
      };

      const rebuildMarquees = () => {
        firstMarquee?.kill();
        secondMarquee?.kill();

        firstMarquee = buildMarquee(firstTrack, "left", 62);
        secondMarquee = buildMarquee(secondTrack, "right", 54);

        const currentScale = isHovering ? 0.22 : 1;

        firstMarquee?.timeScale(currentScale);
        secondMarquee?.timeScale(currentScale);

        firstRowCards = collectCardMeta(firstTrack);
        secondRowCards = collectCardMeta(secondTrack);
        firstRowWidth = firstRow.getBoundingClientRect().width;
        secondRowWidth = secondRow.getBoundingClientRect().width;
      };

      rebuildMarquees();

      // Every frame: work out how far each card sits from the row's
      // centre and curve it in 3D — this is what gives the "wrapping
      // around a sphere" feel as cards drift through the marquee.
      const applyCurvature = (
        track: HTMLDivElement,
        cards: CardMeta[],
        rowWidth: number
      ) => {
        if (!rowWidth || cards.length === 0) return;

        const trackX = (gsap.getProperty(track, "x") as number) || 0;
        const halfWidth = rowWidth / 2;

        cards.forEach(({ el, offsetLeft, width }) => {
          const cardCenter = trackX + offsetLeft + width / 2;
          const normalized = gsap.utils.clamp(
            -1,
            1,
            (cardCenter - halfWidth) / halfWidth
          );

          gsap.set(el, {
            rotateY: normalized * CURVE_MAX_ROTATION,
            z: -Math.abs(normalized) * CURVE_MAX_DEPTH,
            scale: 1 - Math.abs(normalized) * (1 - CURVE_MIN_SCALE),
          });
        });
      };

      const curvatureTicker = () => {
        applyCurvature(firstTrack, firstRowCards, firstRowWidth);
        applyCurvature(secondTrack, secondRowCards, secondRowWidth);
      };

      gsap.ticker.add(curvatureTicker);

      const resizeObserver = new ResizeObserver(() => {
        window.cancelAnimationFrame(rebuildFrame);
        rebuildFrame = window.requestAnimationFrame(rebuildMarquees);
      });

      resizeObserver.observe(section);

      const getMarquees = () =>
        [firstMarquee, secondMarquee].filter(
          (animation): animation is gsap.core.Tween => animation !== null
        );

      const slowMarquees = () => {
        isHovering = true;

        gsap.to(getMarquees(), {
          timeScale: 0.22,
          duration: 0.75,
          ease: "power2.out",
          overwrite: true,
        });
      };

      const resumeMarquees = () => {
        isHovering = false;

        gsap.to(getMarquees(), {
          timeScale: 1,
          duration: 1,
          ease: "power2.out",
          overwrite: true,
        });
      };

      const moveGlowX = gsap.quickTo(pointerGlow, "x", {
        duration: 0.7,
        ease: "power3.out",
      });

      const moveGlowY = gsap.quickTo(pointerGlow, "y", {
        duration: 0.7,
        ease: "power3.out",
      });

      const showPointerGlow = () => {
        gsap.to(pointerGlow, {
          autoAlpha: 0.7,
          duration: 0.45,
          overwrite: true,
        });
      };

      const hidePointerGlow = () => {
        gsap.to(pointerGlow, {
          autoAlpha: 0,
          duration: 0.55,
          overwrite: true,
        });
      };

      const followPointer = (event: PointerEvent) => {
        const bounds = section.getBoundingClientRect();

        moveGlowX(event.clientX - bounds.left);
        moveGlowY(event.clientY - bounds.top);
      };

      const velocityTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          if (isHovering) return;

          const velocityBoost = Math.min(
            Math.abs(self.getVelocity()) / 2200,
            1.3
          );

          const animations = getMarquees();

          gsap.to(animations, {
            timeScale: 1 + velocityBoost,
            duration: 0.2,
            overwrite: true,
          });

          gsap.to(animations, {
            timeScale: 1,
            duration: 0.9,
            delay: 0.15,
            ease: "power2.out",
            overwrite: "auto",
          });
        },
      });

      section.addEventListener("mouseenter", slowMarquees);
      section.addEventListener("mouseleave", resumeMarquees);
      section.addEventListener("pointerenter", showPointerGlow);
      section.addEventListener("pointerleave", hidePointerGlow);
      section.addEventListener("pointermove", followPointer);

      return () => {
        resizeObserver.disconnect();
        velocityTrigger.kill();
        gsap.ticker.remove(curvatureTicker);
        firstMarquee?.kill();
        secondMarquee?.kill();

        window.cancelAnimationFrame(rebuildFrame);

        section.removeEventListener("mouseenter", slowMarquees);
        section.removeEventListener("mouseleave", resumeMarquees);
        section.removeEventListener("pointerenter", showPointerGlow);
        section.removeEventListener("pointerleave", hidePointerGlow);
        section.removeEventListener("pointermove", followPointer);
      };
    }, section);

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Trusted business network"
      className="relative left-1/2 w-[100dvw] -translate-x-1/2 overflow-hidden border-y border-[#120d25]/10 bg-white py-[clamp(3.5rem,6vw,6rem)]"
    >
      <div
        ref={pointerGlowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-0 h-[26rem] w-[26rem] rounded-full bg-violet-300/20 blur-[100px]"
      />

      <div
        ref={sweepRef}
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 z-0 h-[140%] w-28 bg-gradient-to-r from-transparent via-violet-100/50 to-transparent blur-xl"
      />

      <div
        className="relative z-10 space-y-5 sm:space-y-6"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
        }}
      >
        <MarqueeRow
          rowRef={firstRowRef}
          trackRef={firstTrackRef}
          brands={firstRowBrands}
          rowLabel="Digital business examples"
        />

        <MarqueeRow
          rowRef={secondRowRef}
          trackRef={secondTrackRef}
          brands={secondRowBrands}
          rowLabel="Commerce and finance examples"
          alternate
        />
      </div>

      <div className="relative z-10 mt-12 flex w-full flex-col items-start justify-between gap-5 px-[clamp(1.25rem,4vw,5rem)] sm:flex-row sm:items-center">
        <p className="text-xs leading-6 text-[#120d25]/45">
          Fictional brand names are used to preview the kinds of digital
          businesses the platform can support.
        </p>

        <div className="flex shrink-0 items-center gap-3 text-[10px] font-black uppercase tracking-[0.17em] text-[#120d25]/50">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-violet-500/50" />
          Hover to slow the network
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-45" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </div>
      </div>
    </section>
  );
}

function MarqueeRow({
  rowRef,
  trackRef,
  brands,
  rowLabel,
  alternate = false,
}: {
  rowRef: React.RefObject<HTMLDivElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  brands: Brand[];
  rowLabel: string;
  alternate?: boolean;
}) {
  return (
    <div
      ref={rowRef}
      className="w-full overflow-hidden"
      aria-label={rowLabel}
      style={{ perspective: "1400px" }}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        <BrandGroup brands={brands} alternate={alternate} />
        <BrandGroup brands={brands} alternate={alternate} duplicate />
      </div>
    </div>
  );
}

function BrandGroup({
  brands,
  duplicate = false,
  alternate = false,
}: {
  brands: Brand[];
  duplicate?: boolean;
  alternate?: boolean;
}) {
  return (
    <div
      data-marquee-group
      aria-hidden={duplicate || undefined}
      className="flex shrink-0 items-center gap-[clamp(0.75rem,1.4vw,1.4rem)] px-[clamp(0.375rem,0.7vw,0.75rem)]"
    >
      {brands.map((brand) => (
        <div
          key={`${duplicate ? "duplicate" : "primary"}-${brand.name}`}
          data-marquee-float
          className={alternate ? "pt-2" : "pb-2"}
        >
          <BrandCard brand={brand} alternate={alternate} />
        </div>
      ))}
    </div>
  );
}

function BrandCard({
  brand,
  alternate,
}: {
  brand: Brand;
  alternate: boolean;
}) {
  const Icon = brand.icon;

  return (
    <article
      className={`group/card relative flex w-[clamp(16rem,21vw,21.5rem)] shrink-0 items-center gap-[clamp(0.8rem,1.4vw,1.25rem)] overflow-hidden rounded-[clamp(1.25rem,2vw,1.8rem)] border p-[clamp(0.9rem,1.5vw,1.35rem)] backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-500 will-change-transform hover:border-violet-300 hover:shadow-[0_24px_70px_rgba(91,33,182,.16)] [backface-visibility:hidden] ${
        alternate
          ? "border-[#120d25]/10 bg-[#120d25] text-white shadow-[0_16px_50px_rgba(18,13,37,.14)]"
          : "border-[#120d25]/10 bg-white/[0.86] text-[#120d25] shadow-[0_14px_45px_rgba(18,13,37,.07)]"
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-300/0 blur-3xl transition-colors duration-500 group-hover/card:bg-violet-300/35"
      />

      <span
        aria-hidden="true"
        className="absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-violet-500 via-purple-400 to-transparent transition-transform duration-500 group-hover/card:scale-x-100"
      />

      <span
        className={`relative grid h-[clamp(2.6rem,3.6vw,3.2rem)] w-[clamp(2.6rem,3.6vw,3.2rem)] shrink-0 place-items-center rounded-[clamp(0.9rem,1.4vw,1.2rem)] ${
          alternate ? "bg-white/10 text-violet-200" : "bg-violet-50 text-violet-700"
        }`}
      >
        <Icon className="h-[clamp(1.1rem,1.7vw,1.4rem)] w-[clamp(1.1rem,1.7vw,1.4rem)] transition duration-500 group-hover/card:rotate-[-7deg] group-hover/card:scale-110" />
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[clamp(0.82rem,1.2vw,1rem)] font-black tracking-[0.08em]">
            {brand.name.toUpperCase()}
          </span>

          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
        </span>

        <span
          className={`mt-1.5 block text-[10px] font-medium ${
            alternate ? "text-white/[0.48]" : "text-[#120d25]/45"
          }`}
        >
          {brand.category}
        </span>
      </span>

      <span
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition duration-300 group-hover/card:rotate-45 group-hover/card:border-violet-300 group-hover/card:bg-violet-600 group-hover/card:text-white ${
          alternate
            ? "border-white/[0.12] text-white/45"
            : "border-[#120d25]/10 text-[#120d25]/40"
        }`}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </article>
  );
}