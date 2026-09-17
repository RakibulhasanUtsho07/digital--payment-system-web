"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight, HelpCircle, Plus } from "lucide-react";

const faqs = [
  {
    q: "What can I do with a Coffer wallet?",
    a: "You can view your balance, use supported wallet transfers, follow transaction status, manage your profile, and complete required verification steps from one focused dashboard.",
  },
  {
    q: "How is account access protected?",
    a: "Coffer is designed around authenticated sessions, protected backend routes, and role-aware permissions. Public security claims should always match the controls implemented and tested in the backend.",
  },
  {
    q: "Why can a transaction remain pending?",
    a: "Pending means the transaction has not reached a final state yet. Your activity screen should keep the latest status visible and update it when processing completes or fails.",
  },
  {
    q: "When is identity verification required?",
    a: "Some wallet actions can require KYC. The dashboard should show the current verification state and guide you to the next required step before a restricted action continues.",
  },
  {
    q: "What happens when a transfer fails?",
    a: "A failed transfer should appear clearly in your activity history instead of looking successful. Review the transaction details and current wallet state before trying the action again.",
  },
  {
    q: "Where can I review a transaction?",
    a: "Open the activity area and select a transaction to review its amount, recipient, time, and latest status. The exact fields shown depend on what your backend currently provides.",
  },
];

type FaqSectionProps = {
  rootRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
};

export function FaqSection({
  rootRef,
  visible,
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const answerContentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const iconRefs = useRef<Array<HTMLSpanElement | null>>([]);

  /* ----------------------------------------------------------
     Minimal entrance animation
  ---------------------------------------------------------- */
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const list = listRef.current;

    if (!section || !header || !list) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const context = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".minimal-faq-row");

      if (reduceMotion) {
        gsap.set([header, list, ...rows], {
          clearProps: "all",
          autoAlpha: 1,
          y: 0,
        });
        return;
      }

      if (!visible) {
        gsap.set(header, {
          autoAlpha: 0,
          y: 24,
        });

        gsap.set(list, {
          autoAlpha: 0,
          y: 20,
        });

        gsap.set(rows, {
          autoAlpha: 0,
          y: 16,
        });

        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .fromTo(
          header,
          {
            autoAlpha: 0,
            y: 24,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          }
        )
        .fromTo(
          list,
          {
            autoAlpha: 0,
            y: 20,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
          },
          "-=0.4"
        )
        .fromTo(
          rows,
          {
            autoAlpha: 0,
            y: 16,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.065,
          },
          "-=0.42"
        );
    }, section);

    return () => {
      context.revert();
    };
  }, [visible]);

  /* ----------------------------------------------------------
     Smooth accordion animation
  ---------------------------------------------------------- */
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const animations: gsap.core.Tween[] = [];

    faqs.forEach((_, index) => {
      const answer = answerRefs.current[index];
      const content = answerContentRefs.current[index];
      const icon = iconRefs.current[index];
      const isOpen = openIndex === index;

      if (!answer || !content || !icon) return;

      if (reduceMotion) {
        gsap.set(answer, {
          height: isOpen ? "auto" : 0,
        });

        gsap.set(content, {
          autoAlpha: isOpen ? 1 : 0,
          y: 0,
        });

        gsap.set(icon, {
          rotate: isOpen ? 45 : 0,
        });

        return;
      }

      animations.push(
        gsap.to(answer, {
          height: isOpen ? "auto" : 0,
          duration: isOpen ? 0.5 : 0.4,
          ease: "power3.inOut",
          overwrite: true,
        })
      );

      animations.push(
        gsap.to(content, {
          autoAlpha: isOpen ? 1 : 0,
          y: isOpen ? 0 : -8,
          duration: isOpen ? 0.4 : 0.22,
          delay: isOpen ? 0.1 : 0,
          ease: isOpen ? "power2.out" : "power2.in",
          overwrite: true,
        })
      );

      animations.push(
        gsap.to(icon, {
          rotate: isOpen ? 45 : 0,
          duration: 0.4,
          ease: "power3.out",
          overwrite: true,
        })
      );
    });

    return () => {
      animations.forEach((animation) => animation.kill());
    };
  }, [openIndex]);

  return (
    <section
      id="faq"
      ref={sectionRef}
      aria-labelledby="faq-heading"
      className="relative left-1/2 w-[100dvw] -translate-x-1/2 scroll-mt-24 border-y border-[#120d25]/10 bg-white text-[#120d25]"
    >
      <div
        ref={rootRef}
        className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
      >
        {/* Minimal centered heading */}
        <div ref={headerRef} className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 sm:text-xs">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Frequently asked questions
          </div>

          <h2
            id="faq-heading"
            className="mt-5 text-[clamp(2.4rem,5vw,4.4rem)] font-black leading-[0.96] tracking-[-0.06em]"
          >
            Clear answers about
            <span className="block text-violet-700">your wallet.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#120d25]/55 sm:text-base">
            Find simple information about wallet access, transaction status,
            verification, and account activity.
          </p>
        </div>

        {/* Minimal accordion */}
        <div
          ref={listRef}
          className="mt-12 overflow-hidden rounded-[24px] border border-[#120d25]/10 bg-white sm:mt-14 sm:rounded-[28px]"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;

            return (
              <article
                key={faq.q}
                className={`minimal-faq-row relative border-b border-[#120d25]/10 transition-colors duration-300 last:border-b-0 ${
                  isOpen ? "bg-violet-50/60" : "bg-white hover:bg-[#faf9fc]"
                }`}
              >
                <button
                  id={questionId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="group flex w-full items-center gap-4 px-5 py-5 text-left outline-none sm:gap-6 sm:px-7 sm:py-6 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-violet-300/50"
                >
                  <span
                    className={`w-7 shrink-0 text-[10px] font-black tracking-[0.16em] transition-colors sm:w-8 sm:text-xs ${
                      isOpen
                        ? "text-violet-700"
                        : "text-[#120d25]/30 group-hover:text-violet-600"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={`min-w-0 flex-1 text-base font-black leading-snug tracking-[-0.025em] transition-colors sm:text-lg ${
                      isOpen
                        ? "text-violet-800"
                        : "text-[#120d25] group-hover:text-violet-800"
                    }`}
                  >
                    {faq.q}
                  </span>

                  <span
                    ref={(node) => {
                      iconRefs.current[index] = node;
                    }}
                    aria-hidden="true"
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-300 sm:h-10 sm:w-10 ${
                      isOpen
                        ? "border-violet-700 bg-violet-700 text-white"
                        : "border-[#120d25]/15 bg-white text-[#120d25]/65 group-hover:border-violet-300 group-hover:text-violet-700"
                    }`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </span>
                </button>

                <div
                  id={answerId}
                  ref={(node) => {
                    answerRefs.current[index] = node;
                  }}
                  role="region"
                  aria-labelledby={questionId}
                  aria-hidden={!isOpen}
                  className="overflow-hidden"
                  style={{ height: index === 0 ? "auto" : 0 }}
                >
                  <div
                    ref={(node) => {
                      answerContentRefs.current[index] = node;
                    }}
                    className="pb-6 pl-16 pr-6 sm:pb-7 sm:pl-[5.25rem] sm:pr-20"
                    style={{ opacity: index === 0 ? 1 : 0 }}
                  >
                    <p className="max-w-2xl text-sm leading-7 text-[#120d25]/58 sm:text-base">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Small, non-distracting footer action */}
        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center sm:flex-row">
          <p className="text-sm text-[#120d25]/50">
            Ready to manage your account?
          </p>

          <a
            href="#open-wallet"
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-black text-violet-700 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-4 focus-visible:ring-violet-300/50"
          >
            Open your wallet
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
