"use client";

/* =========================================================
   CONTENT
========================================================= */

const FAQ_ITEMS = [
  {
    question: "Is my money and data secure?",
    answer:
      "Yes. Your wallet is protected with encryption, KYC verification and optional two-factor authentication.",
  },
  {
    question: "How long do transfers take?",
    answer:
      "Wallet-to-wallet transfers on Coffer are instant. Bank or MFS top-ups may take a few minutes.",
  },
  {
    question: "Do I need to verify my identity?",
    answer:
      "KYC verification is required before sending money or withdrawing funds, to keep every account secure.",
  },
  {
    question: "Is there a fee to use Coffer?",
    answer:
      "Basic wallet features are free. Any applicable fees are always shown clearly before you confirm an action.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function FaqDrawer() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FAQ_ITEMS.map((item) => (
        <div
          key={item.question}
          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <p className="text-sm font-extrabold text-slate-900">
            {item.question}
          </p>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            {item.answer}
          </p>
        </div>
      ))}
    </div>
  );
}