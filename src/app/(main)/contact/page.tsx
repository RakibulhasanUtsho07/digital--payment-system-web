import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Contact | Coffer",
  description:
    "Get in touch with the Coffer team for account, payment, merchant, and platform support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F1F3ED] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#111827] px-5 py-10 text-white sm:px-8 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
              <MessageCircle className="h-4 w-4" />
              Coffer Support
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              How can we help?
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Whether you need help with your wallet, payments, merchant
              account, or Coffer platform features, our support team is here
              to guide you.
            </p>
          </div>
        </section>

        {/* CONTACT OPTIONS */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Mail className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900">
              Email Support
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Contact our support team for general account and platform
              assistance.
            </p>

            <a
              href="mailto:support@coffer.com"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-600 transition hover:text-violet-700"
            >
              support@coffer.com
              <ArrowRight className="h-4 w-4" />
            </a>
          </article>

          <article className="rounded-[24px] bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Clock3 className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900">
              Support Hours
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Our support team reviews account, payment, and merchant issues
              during regular support hours.
            </p>

            <p className="mt-5 text-sm font-bold text-slate-700">
              Sunday – Thursday
            </p>
          </article>

          <article className="rounded-[24px] bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900">
              Account Support
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Already have a Coffer account? Sign in to access your dashboard
              and account-specific support features.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
            >
              Sign in to Coffer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </section>

        {/* CTA */}
        <section className="mt-6 flex flex-col gap-5 rounded-[28px] bg-white p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">
              New to Coffer?
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
              Create your digital wallet
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create an account to access secure wallet services, payments,
              transfers, receipts, and more.
            </p>
          </div>

          <Link
            href="/register"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700"
          >
            Create Wallet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}