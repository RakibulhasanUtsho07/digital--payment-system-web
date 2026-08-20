"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LockKeyhole, ShieldCheck } from "lucide-react";

const productLinks = [
  { label: "Digital Wallet", href: "#" },
  { label: "Money Transfer", href: "#" },
  { label: "Payment Gateway", href: "#" },
  { label: "Merchant Solutions", href: "#" },
];

const companyLinks = [
  { label: "About Us", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Security", href: "#" },
  { label: "Contact", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Compliance", href: "#" },
];

// One staggered reveal for the whole footer, not a separate animation
// per column — the columns arrive as one coordinated moment.
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative inline-block text-muted-foreground transition-colors hover:text-primary"
    >
      {label}
      <span className="absolute bottom-0 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
        className="mx-auto max-w-7xl px-6 py-12"
      >
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand Info */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="inline-block"
            >
              <Link href="/" className="text-xl font-bold tracking-tight text-primary">
                Coffer
              </Link>
            </motion.div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A modern digital wallet designed for fast, secure, and hassle-free money management.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <FooterLink {...l} />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <FooterLink {...l} />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <FooterLink {...l} />
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row"
        >
          <p>© {new Date().getFullYear()} Coffer. All rights reserved.</p>
          <div className="flex gap-5">
            <span className="flex items-center gap-1.5 transition-colors hover:text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              PCI-DSS Compliant
            </span>
            <span className="flex items-center gap-1.5 transition-colors hover:text-primary">
              <LockKeyhole className="h-3.5 w-3.5 text-primary" />
              256-Bit SSL Encrypted
            </span>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}