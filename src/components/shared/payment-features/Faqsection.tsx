"use client";

import { useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import type { Faq } from "./Types";

const FAQS: Faq[] = [
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

export function FaqSection({
  rootRef,
  visible,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}) {
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div ref={rootRef} className={`max-w-4xl mx-auto space-y-8 reveal ${visible ? "in" : ""}`}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase">
          <HelpCircle className="w-4 h-4" /> Got Questions?
        </div>
        <h3 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h3>
      </div>

      <div className="grid gap-4">
        {FAQS.map((faq, i) => {
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
  );
}