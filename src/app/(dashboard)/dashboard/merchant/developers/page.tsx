"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  Code2,
  ExternalLink,
  FileKey2,
  Globe2,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Terminal,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

/* =========================================================
   TYPES
========================================================= */

type ApiEnvironment =
  | "test"
  | "live";

type GuideSection =
  | "quick-start"
  | "create-order"
  | "verify-order"
  | "webhooks"
  | "security";

interface SectionLink {
  id: GuideSection;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface CodeBlockProps {
  title: string;
  language: string;
  code: string;
}

/* =========================================================
   API URL
========================================================= */

const ROOT_API_URL =
  (
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api"
  ).replace(
    /\/+$/,
    "",
  );

const GATEWAY_API_URL =
  /\/v1$/i.test(
    ROOT_API_URL,
  )
    ? ROOT_API_URL
    : `${ROOT_API_URL}/v1`;

/* =========================================================
   NAVIGATION
========================================================= */

const SECTIONS:
  SectionLink[] = [
    {
      id:
        "quick-start",

      label:
        "Quick start",

      description:
        "Prepare your server.",

      icon:
        Terminal,
    },

    {
      id:
        "create-order",

      label:
        "Create order",

      description:
        "Start checkout.",

      icon:
        CircleDollarSign,
    },

    {
      id:
        "verify-order",

      label:
        "Verify order",

      description:
        "Confirm payment.",

      icon:
        BadgeCheck,
    },

    {
      id:
        "webhooks",

      label:
        "Webhooks",

      description:
        "Receive events.",

      icon:
        Webhook,
    },

    {
      id:
        "security",

      label:
        "Security",

      description:
        "Go production-ready.",

      icon:
        ShieldCheck,
    },
  ];

/* =========================================================
   SCOPES
========================================================= */

const SCOPES = [
  {
    scope:
      "orders:write",

    purpose:
      "Create hosted-checkout orders.",
  },

  {
    scope:
      "orders:read",

    purpose:
      "Read your own order status.",
  },

  {
    scope:
      "payments:read",

    purpose:
      "Read payment details belonging to your merchant.",
  },

  {
    scope:
      "refunds:write",

    purpose:
      "Create refunds when your integration needs them.",
  },

  {
    scope:
      "webhooks:manage",

    purpose:
      "Manage webhook endpoints through the API.",
  },
];

/* =========================================================
   HERO BACKGROUND
========================================================= */

function AuroraBackground() {
  return (
    <>
      <div
        className="
          pointer-events-none
          absolute
          inset-0
        "
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-24
          h-72
          w-72
          rounded-full
          bg-fuchsia-300/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            18,
            0,
          ],

          y: [
            0,
            -10,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration:
            11,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-24
          left-1/3
          h-64
          w-64
          rounded-full
          bg-cyan-300/15
          blur-3xl
        "
        animate={{
          scale: [
            1,
            1.12,
            1,
          ],
        }}
        transition={{
          duration:
            13,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   CODE BLOCK
========================================================= */

function CodeBlock({
  title,
  language,
  code,
}: CodeBlockProps) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const copyCode =
    async () => {
      try {
        await navigator.clipboard.writeText(
          code,
        );

        setCopied(
          true,
        );

        window.setTimeout(
          () => {
            setCopied(
              false,
            );
          },
          1600,
        );
      } catch {
        setCopied(
          false,
        );
      }
    };

  return (
    <div
      className="
        min-w-0
        overflow-hidden
        rounded-[22px]
        bg-[#130A22]
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          justify-between
          gap-3
          border-b
          border-white/10
          bg-white/[0.035]
          px-4
          py-3
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              gap-1.5
            "
          >
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />

            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          <p
            className="
              truncate
              text-xs
              font-black
              text-violet-100
            "
          >
            {title}
          </p>

          <span
            className="
              hidden
              rounded-md
              bg-white/10
              px-2
              py-1
              text-[9px]
              font-black
              uppercase
              tracking-wider
              text-violet-200/60

              sm:inline-flex
            "
          >
            {language}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            void copyCode();
          }}
          className="
            inline-flex
            h-8
            shrink-0
            items-center
            gap-2
            rounded-lg
            bg-white/10
            px-3
            text-[10px]
            font-black
            text-violet-100
            transition

            hover:bg-white/15
          "
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Clipboard className="h-3.5 w-3.5" />
          )}

          {copied
            ? "Copied"
            : "Copy"}
        </button>
      </div>

      <pre
        className="
          max-h-[540px]
          overflow-auto
          p-4
          font-mono
          text-[12px]
          leading-6
          text-violet-100/85

          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden

          sm:p-5
          sm:text-[13px]
        "
      >
        <code>
          {code}
        </code>
      </pre>
    </div>
  );
}

/* =========================================================
   GUIDE TAB
========================================================= */

function GuideTab({
  section,
  active,
  onClick,
}: {
  section: SectionLink;

  active: boolean;

  onClick: () => void;
}) {
  const Icon =
    section.icon;

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        relative
        flex
        min-w-[160px]
        flex-1
        items-center
        gap-3
        overflow-hidden
        rounded-2xl
        px-3.5
        py-3
        text-left
        transition

        ${
          active
            ? "text-violet-700 dark:text-violet-200"
            : "merchant-muted hover:bg-violet-500/5 hover:text-violet-700 dark:hover:text-violet-300"
        }
      `}
    >
      {active ? (
        <motion.span
          layoutId="developer-guide-tab"
          className="
            absolute
            inset-0
            rounded-2xl
            bg-violet-500/10
            ring-1
            ring-violet-500/15
          "
          transition={{
            type:
              "spring",

            stiffness:
              380,

            damping:
              32,
          }}
        />
      ) : null}

      <span
        className={`
          relative
          z-10
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          transition

          ${
            active
              ? "bg-violet-600 text-white"
              : "bg-violet-500/5 text-violet-600"
          }
        `}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span
        className="
          relative
          z-10
          min-w-0
        "
      >
        <span
          className="
            block
            truncate
            text-xs
            font-black
          "
        >
          {section.label}
        </span>

        <span
          className="
            mt-0.5
            block
            truncate
            text-[9px]
            opacity-65
          "
        >
          {section.description}
        </span>
      </span>
    </button>
  );
}

/* =========================================================
   STEP
========================================================= */

function StepCard({
  number,
  title,
  description,
  icon:
    Icon,
}: {
  number: string;

  title: string;

  description: string;

  icon: LucideIcon;
}) {
  return (
    <motion.article
      whileHover={{
        y:
          -2,
      }}
      className="
        rounded-[20px]
        bg-violet-500/5
        p-4
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-600
          "
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p
            className="
              text-[9px]
              font-black
              uppercase
              tracking-[0.14em]
              text-violet-600
            "
          >
            Step {number}
          </p>

          <h3
            className="
              mt-1
              break-words
              text-sm
              font-black
              leading-tight
              merchant-text
              [overflow-wrap:anywhere]
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              text-xs
              leading-5
              merchant-muted
            "
          >
            {description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-2xl
        bg-violet-500/5
        p-4
      "
    >
      <p
        className="
          text-[9px]
          font-black
          uppercase
          tracking-[0.13em]
          merchant-muted
        "
      >
        {label}
      </p>

      <p
        title={
          value
        }
        className="
          mt-2
          break-all
          font-mono
          text-xs
          font-black
          merchant-text
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
  icon:
    Icon,
}: {
  eyebrow: string;

  title: string;

  description: string;

  icon: LucideIcon;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        border-b
        border-violet-500/10
        pb-5
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-violet-500/10
          text-violet-600
        "
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-violet-600
          "
        >
          {eyebrow}
        </p>

        <h2
          className="
            mt-1
            break-words
            text-xl
            font-black
            leading-tight
            tracking-tight
            merchant-text
            [overflow-wrap:anywhere]

            sm:text-2xl
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-1
            max-w-3xl
            text-xs
            leading-6
            merchant-muted
          "
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SECURITY ITEM
========================================================= */

function SecurityItem({
  title,
  description,
  icon:
    Icon,
}: {
  title: string;

  description: string;

  icon: LucideIcon;
}) {
  return (
    <motion.div
      whileHover={{
        y:
          -2,
      }}
      className="
        flex
        items-start
        gap-4
        rounded-2xl
        bg-violet-500/5
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-violet-500/10
          text-violet-600
        "
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <h3
          className="
            text-sm
            font-black
            merchant-text
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-1
            text-xs
            leading-6
            merchant-muted
          "
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantDevelopersPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isMerchantRole =
    user.role === "merchant";

  useEffect(() => {
    if (isMerchantRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const [
    environment,
    setEnvironment,
  ] =
    useState<ApiEnvironment>(
      "test",
    );

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<GuideSection>(
      "quick-start",
    );

  /* =======================================================
     ENVIRONMENT
  ======================================================== */

  const keyPlaceholder =
    environment ===
    "test"
      ? "sk_test_your_secret_key"
      : "sk_live_your_secret_key";

  const environmentCode =
    environment;

  /* =======================================================
     EXAMPLES
  ======================================================== */

  const examples =
    useMemo(
      () => {
        const env =
          [
            `COFFER_API_URL=${GATEWAY_API_URL}`,
            `COFFER_SECRET_KEY=${keyPlaceholder}`,
            "COFFER_WEBHOOK_SECRET=whsec_your_signing_secret",
            "APP_URL=https://your-merchant-app.com",
          ].join(
            "\n",
          );

        const createOrder =
          [
            "// Run this code only on your server.",
            "export async function createCofferOrder(order) {",
            "  const response = await fetch(",
            "    `${process.env.COFFER_API_URL}/orders`,",
            "    {",
            '      method: "POST",',
            "      headers: {",
            "        Authorization: `Bearer ${process.env.COFFER_SECRET_KEY}`,",
            '        "Content-Type": "application/json",',
            '        "Idempotency-Key": order.id,',
            "      },",
            "      body: JSON.stringify({",
            "        amount: order.total,",
            '        currency: "BDT",',
            "        merchantReference: order.id,",
            "        description: `Payment for order ${order.id}`,",
            "        customer: {",
            "          name: order.customer.name,",
            "          email: order.customer.email,",
            "          externalCustomerId: order.customer.id,",
            "        },",
            "        items: order.items.map((item) => ({",
            "          name: item.name,",
            "          sku: item.sku,",
            "          quantity: item.quantity,",
            "          unitAmount: item.unitAmount,",
            "        })),",
            "        returnUrl: `${process.env.APP_URL}/payment/success`,",
            "        cancelUrl: `${process.env.APP_URL}/payment/cancel`,",
            "        expiresInMinutes: 30,",
            "      }),",
            "    },",
            "  );",
            "",
            "  const data = await response.json();",
            "",
            "  if (!response.ok) {",
            '    throw new Error(data.message || "Unable to create Coffer order.");',
            "  }",
            "",
            "  return data.order;",
            "}",
          ].join(
            "\n",
          );

        const nextRoute =
          [
            '// app/api/checkout/route.ts',
            'import { NextResponse } from "next/server";',
            "",
            "export async function POST(request: Request) {",
            "  const order = await request.json();",
            "",
            "  const response = await fetch(",
            "    `${process.env.COFFER_API_URL}/orders`,",
            "    {",
            '      method: "POST",',
            "      headers: {",
            "        Authorization: `Bearer ${process.env.COFFER_SECRET_KEY}`,",
            '        "Content-Type": "application/json",',
            '        "Idempotency-Key": order.id,',
            "      },",
            "      body: JSON.stringify({",
            "        amount: order.total,",
            '        currency: "BDT",',
            "        merchantReference: order.id,",
            "        description: `Payment for order ${order.id}`,",
            "        returnUrl: `${process.env.APP_URL}/payment/success`,",
            "        cancelUrl: `${process.env.APP_URL}/payment/cancel`,",
            "        expiresInMinutes: 30,",
            "      }),",
            "    },",
            "  );",
            "",
            "  const data = await response.json();",
            "",
            "  return NextResponse.json(",
            "    data,",
            "    { status: response.status },",
            "  );",
            "}",
          ].join(
            "\n",
          );

        const redirect =
          [
            'const response = await fetch("/api/checkout", {',
            '  method: "POST",',
            '  headers: { "Content-Type": "application/json" },',
            "  body: JSON.stringify(yourOrder),",
            "});",
            "",
            "const data = await response.json();",
            "",
            "if (!response.ok) {",
            '  throw new Error(data.message || "Checkout could not start.");',
            "}",
            "",
            "// Redirect only to the hosted checkout URL returned by Coffer.",
            "window.location.assign(data.order.checkoutUrl);",
          ].join(
            "\n",
          );

        const verifyOrder =
          [
            "export async function getCofferOrder(orderId) {",
            "  const response = await fetch(",
            "    `${process.env.COFFER_API_URL}/orders/${encodeURIComponent(orderId)}`,",
            "    {",
            '      method: "GET",',
            "      headers: {",
            "        Authorization: `Bearer ${process.env.COFFER_SECRET_KEY}`,",
            "      },",
            '      cache: "no-store",',
            "    },",
            "  );",
            "",
            "  const data = await response.json();",
            "",
            "  if (!response.ok) {",
            '    throw new Error(data.message || "Unable to verify order.");',
            "  }",
            "",
            "  return data.order;",
            "}",
          ].join(
            "\n",
          );

        const webhook =
          [
            'import crypto from "node:crypto";',
            'import express from "express";',
            "",
            "const app = express();",
            "",
            "app.post(",
            '  "/webhooks/coffer",',
            '  express.raw({ type: "application/json" }),',
            "  async (req, res) => {",
            '    const rawBody = req.body.toString("utf8");',
            '    const timestamp = req.header("Coffer-Timestamp") || "";',
            '    const signature = req.header("Coffer-Signature") || "";',
            '    const secret = process.env.COFFER_WEBHOOK_SECRET || "";',
            "",
            "    const signedPayload = `${timestamp}.${rawBody}`;",
            "",
            "    const expected = crypto",
            '      .createHmac("sha256", secret)',
            '      .update(signedPayload, "utf8")',
            '      .digest("hex");',
            "",
            '    const receivedBuffer = Buffer.from(signature, "utf8");',
            '    const expectedBuffer = Buffer.from(expected, "utf8");',
            "",
            "    const valid =",
            "      receivedBuffer.length === expectedBuffer.length &&",
            "      crypto.timingSafeEqual(",
            "        receivedBuffer,",
            "        expectedBuffer,",
            "      );",
            "",
            "    if (!valid) {",
            '      res.status(401).send("Invalid signature");',
            "      return;",
            "    }",
            "",
            "    const event = JSON.parse(rawBody);",
            "",
            "    // Persist event.id first so duplicate deliveries",
            "    // do not process your order twice.",
            '    if (event.type === "payment.completed") {',
            "      await markOrderAsPaid(",
            "        event.data.payment.merchantReference,",
            "      );",
            "    }",
            "",
            "    res.status(200).json({",
            "      received: true,",
            "    });",
            "  },",
            ");",
          ].join(
            "\n",
          );

        return {
          env,
          createOrder,
          nextRoute,
          redirect,
          verifyOrder,
          webhook,
        };
      },
      [
        keyPlaceholder,
      ],
    );

  const selectedSection =
    SECTIONS.find(
      (
        section,
      ) =>
        section.id ===
        activeSection,
    ) ??
    SECTIONS[0];

  const SelectedIcon =
    selectedSection.icon;

  /* =======================================================
     START GUIDE
  ======================================================== */

  const startIntegration =
    () => {
      if (!isMerchantRole) {
        return;
      }

      setActiveSection(
        "quick-start",
      );

      document
        .getElementById(
          "developer-guide",
        )
        ?.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start",
        });
    };

  /* =======================================================
     MERCHANT-ONLY REDIRECTING
  ======================================================== */

  if (!isMerchantRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 text-foreground">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Merchant Developer Platform is available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================== */

  return (
    <main
      className="
        merchant-theme
        min-h-full
        px-4
        py-5

        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1550px]
          space-y-5
        "
      >
        {/* =================================================
            HERO
        ================================================= */}

        <motion.header
          initial={{
            opacity:
              0,

            y:
              12,
          }}
          animate={{
            opacity:
              1,

            y:
              0,
          }}
          className="
            relative
            overflow-hidden
            rounded-[30px]
            p-5
            text-white

            sm:p-7
            lg:p-8
          "
        >
          <AuroraBackground />

          <div className="relative z-10">
            <div
              className="
                flex
                flex-col
                gap-7

                xl:flex-row
                xl:items-end
                xl:justify-between
              "
            >
              <div className="min-w-0 max-w-3xl">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-3
                    py-1.5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    backdrop-blur
                  "
                >
                  <Code2 className="h-3.5 w-3.5" />

                  Coffer developer platform
                </div>

                <h1
                  className="
                    mt-4
                    break-words
                    text-2xl
                    font-black
                    leading-tight
                    tracking-tight
                    [overflow-wrap:anywhere]

                    sm:text-3xl
                    lg:text-4xl
                  "
                >
                  Integrate Coffer,
                  <br className="hidden sm:block" />
                  ship payments faster.
                </h1>

                <p
                  className="
                    mt-3
                    max-w-2xl
                    text-sm
                    leading-7
                    text-violet-100/80
                  "
                >
                  Create payment orders from your secure backend,
                  launch Coffer hosted checkout and keep your systems
                  synchronized with signed webhook events.
                </p>
              </div>

              <div
                className="
                  flex
                  w-full
                  flex-col
                  gap-3

                  sm:w-auto
                  sm:flex-row
                "
              >
                <Link
                  href="/dashboard/merchant/api-keys"
                  className="
                    inline-flex
                    h-11
                    w-full
                    items-center

                    sm:w-auto
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-sm
                    font-black
                    text-white
                    backdrop-blur
                    transition

                    hover:bg-white/15
                  "
                >
                  <KeyRound className="h-4 w-4" />

                  API keys
                </Link>

                <Link
                  href="/dashboard/merchant/webhooks"
                  className="
                    inline-flex
                    h-11
                    w-full
                    items-center

                    sm:w-auto
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-white
                    px-4
                    text-sm
                    font-black
                    text-violet-700
                    transition

                    hover:bg-violet-50
                  "
                >
                  <Webhook className="h-4 w-4" />

                  Webhooks
                </Link>
              </div>
            </div>

            {/* FLOW */}

            <div
              className="
                mt-7
                grid
                gap-2.5

                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              <HeroStep
                number="01"
                title="Server"
                description="Create order"
                icon={
                  Terminal
                }
              />

              <HeroStep
                number="02"
                title="Checkout"
                description="Redirect customer"
                icon={
                  Globe2
                }
              />

              <HeroStep
                number="03"
                title="Payment"
                description="Verify final state"
                icon={
                  BadgeCheck
                }
              />

              <HeroStep
                number="04"
                title="Webhook"
                description="Sync your system"
                icon={
                  Webhook
                }
              />
            </div>
          </div>
        </motion.header>

        {/* =================================================
            ENVIRONMENT + BASE URL
        ================================================= */}

        <section
          className="
            grid
            gap-4

            lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.55fr)]
          "
        >
          <div
            className="
              rounded-[24px]
              merchant-surface
              p-5

              sm:p-6
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-violet-600
                  "
                >
                  <Zap className="h-3.5 w-3.5" />

                  Integration mode
                </div>

                <h2
                  className="
                    mt-2
                    text-lg
                    font-black
                    merchant-text
                  "
                >
                  {environment ===
                  "test"
                    ? "Build safely in Sandbox"
                    : "Production API"}
                </h2>

                <p
                  className="
                    mt-1
                    max-w-xl
                    text-xs
                    leading-5
                    merchant-muted
                  "
                >
                  {environment ===
                  "test"
                    ? "Test orders and payments stay isolated from real customer wallets and live merchant balances."
                    : "Live access requires an active, verified merchant account with live access enabled."}
                </p>
              </div>

              <div
                className="
                  flex
                  w-full
                  shrink-0
                  rounded-2xl
                  bg-violet-500/5
                  p-1

                  sm:w-auto
                "
              >
                {(
                  [
                    "test",
                    "live",
                  ] as const
                ).map(
                  (
                    mode,
                  ) => (
                    <button
                      key={
                        mode
                      }
                      type="button"
                      onClick={() => {
                        if (!isMerchantRole) {
                          return;
                        }

                        setEnvironment(
                          mode,
                        );
                      }}
                      className={`
                        relative
                        h-10
                        min-w-0
                        flex-1
                        rounded-xl

                        sm:min-w-[92px]
                        px-4
                        text-xs
                        font-black
                        capitalize
                        transition

                        ${
                          environment ===
                          mode
                            ? "text-violet-700 dark:text-violet-200"
                            : "merchant-muted hover:text-violet-600"
                        }
                      `}
                    >
                      {environment ===
                      mode ? (
                        <motion.span
                          layoutId="developer-environment-pill"
                          className="
                            absolute
                            inset-0
                            rounded-xl
                            bg-white
                            shadow-sm

                            dark:bg-violet-500/15
                          "
                          transition={{
                            type:
                              "spring",

                            stiffness:
                              400,

                            damping:
                              32,
                          }}
                        />
                      ) : null}

                      <span className="relative z-10">
                        {mode}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div
            className="
              relative
              overflow-hidden
              rounded-[24px]
              bg-[#18092D]
              p-5
              text-white

              sm:p-6
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-14
                -top-16
                h-40
                w-40
                rounded-full
                bg-violet-500/25
                blur-3xl
              "
            />

            <div className="relative">
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-violet-300
                "
              >
                <Globe2 className="h-4 w-4" />

                API base URL
              </div>

              <p
                className="
                  mt-3
                  break-all
                  font-mono
                  text-sm
                  font-black
                  leading-6
                  text-white
                "
              >
                {GATEWAY_API_URL}
              </p>

              <p
                className="
                  mt-3
                  text-[10px]
                  leading-5
                  text-violet-100/60
                "
              >
                Use{" "}
                <span className="font-black text-violet-200">
                  sk_{environmentCode}_...
                </span>{" "}
                from your secure backend.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            GUIDE
        ================================================= */}

        <section
          id="developer-guide"
          className="
            scroll-mt-5
            overflow-hidden
            rounded-[28px]
            merchant-surface
          "
        >
          {/* GUIDE TOP */}

          <div
            className="
              p-4

              sm:p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                px-1

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-violet-600
                  "
                >
                  Developer guide
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    merchant-muted
                  "
                >
                  Follow the complete Coffer integration lifecycle.
                </p>
              </div>

              <span
                className={`
                  shrink-0
                  rounded-full
                  px-3
                  py-1.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-wider

                  ${
                    environment ===
                    "test"
                      ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  }
                `}
              >
                {environment} mode
              </span>
            </div>

            {/* IMPORTANT:
                FULL-WIDTH HORIZONTAL NAV.
                NO LEFT 300PX SIDEBAR.
            */}

            <div
              className="
                mt-4
                overflow-x-auto
                rounded-[20px]
                bg-violet-500/[0.035]
                p-1.5

                [scrollbar-width:none]
                [-ms-overflow-style:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              <div
                className="
                  flex
                  min-w-max
                  gap-1

                  xl:min-w-0
                "
              >
                {SECTIONS.map(
                  (
                    section,
                  ) => (
                    <GuideTab
                      key={
                        section.id
                      }
                      section={
                        section
                      }
                      active={
                        activeSection ===
                        section.id
                      }
                      onClick={() => {
                        if (!isMerchantRole) {
                          return;
                        }

                        setActiveSection(
                          section.id,
                        );
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          {/* CONTENT */}

          <div
            className="
              border-t
              border-violet-500/10
              p-5

              sm:p-7
              lg:p-8
            "
          >
            <AnimatePresence
              mode="wait"
            >
              <motion.div
                key={
                  activeSection
                }
                initial={{
                  opacity:
                    0,

                  y:
                    8,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                exit={{
                  opacity:
                    0,

                  y:
                    -5,
                }}
                transition={{
                  duration:
                    0.2,
                }}
                className="
                  w-full
                  min-w-0
                "
              >
                {/* =========================================
                    QUICK START
                ========================================== */}

                {activeSection ===
                "quick-start" ? (
                  <div
                    className="
                      space-y-6
                    "
                  >
                    <SectionHeading
                      eyebrow={`${environment} integration`}
                      title="Start your integration"
                      description="Configure Coffer on your server first. Your secret API key must never be exposed to browser-side code."
                      icon={
                        SelectedIcon
                      }
                    />

                    <div
                      className="
                        grid
                        gap-3

                        md:grid-cols-3
                      "
                    >
                      <StepCard
                        number="01"
                        title="Create API key"
                        description="Create a Test key first and enable only the scopes required by your backend."
                        icon={
                          KeyRound
                        }
                      />

                      <StepCard
                        number="02"
                        title="Store securely"
                        description="Save the secret in your server environment. Never send it to the browser."
                        icon={
                          LockKeyhole
                        }
                      />

                      <StepCard
                        number="03"
                        title="Create order"
                        description="Your backend creates the Coffer order and returns only checkoutUrl."
                        icon={
                          CircleDollarSign
                        }
                      />
                    </div>

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        bg-amber-500/10
                        p-4
                        text-amber-800

                        dark:text-amber-300
                      "
                    >
                      <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />

                      <div>
                        <p
                          className="
                            text-xs
                            font-black
                          "
                        >
                          Server-side only
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-6
                            opacity-80
                          "
                        >
                          Never place a Coffer secret key in a React
                          component, browser request, public
                          repository or{" "}
                          <code
                            className="
                              rounded
                              bg-amber-500/10
                              px-1
                              py-0.5
                              font-mono
                              text-[10px]
                              font-black
                            "
                          >
                            NEXT_PUBLIC_
                          </code>{" "}
                          variable.
                        </p>
                      </div>
                    </div>

                    <CodeBlock
                      title=".env.local"
                      language="ENV"
                      code={
                        examples.env
                      }
                    />

                    {/* SCOPES */}

                    <div>
                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <ShieldCheck className="h-4 w-4 text-violet-600" />

                          <h3
                            className="
                              text-sm
                              font-black
                              merchant-text
                            "
                          >
                            Recommended scopes
                          </h3>
                        </div>

                        <span
                          className="
                            text-[9px]
                            font-black
                            uppercase
                            tracking-wider
                            merchant-muted
                          "
                        >
                          Least privilege
                        </span>
                      </div>

                      <div
                        className="
                          mt-3
                          grid
                          gap-2

                          lg:grid-cols-2
                        "
                      >
                        {SCOPES.map(
                          (
                            item,
                          ) => (
                            <div
                              key={
                                item.scope
                              }
                              className="
                                flex
                                items-start
                                gap-3
                                rounded-2xl
                                bg-violet-500/5
                                p-4
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-9
                                  w-9
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-violet-500/10
                                  text-violet-600
                                "
                              >
                                <Code2 className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <code
                                  className="
                                    block
                                    break-all
                                    text-xs
                                    font-black
                                    text-violet-700

                                    dark:text-violet-300
                                  "
                                >
                                  {
                                    item.scope
                                  }
                                </code>

                                <p
                                  className="
                                    mt-1
                                    text-xs
                                    leading-5
                                    merchant-muted
                                  "
                                >
                                  {
                                    item.purpose
                                  }
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* =========================================
                    CREATE ORDER
                ========================================== */}

                {activeSection ===
                "create-order" ? (
                  <div className="space-y-6">
                    <SectionHeading
                      eyebrow={`${environment} integration`}
                      title="Create a hosted-checkout order"
                      description="Create Coffer orders from your merchant backend, then pass only the generated checkout URL to your frontend."
                      icon={
                        CircleDollarSign
                      }
                    />

                    <div
                      className="
                        grid
                        gap-3

                        sm:grid-cols-3
                      "
                    >
                      <InfoCard
                        label="Method"
                        value="POST /orders"
                      />

                      <InfoCard
                        label="Required scope"
                        value="orders:write"
                      />

                      <InfoCard
                        label="Authentication"
                        value={`Bearer sk_${environmentCode}_...`}
                      />
                    </div>

                    <CodeBlock
                      title="coffer.ts"
                      language="TypeScript"
                      code={
                        examples.createOrder
                      }
                    />

                    <div
                      className="
                        grid
                        gap-5

                        xl:grid-cols-2
                      "
                    >
                      <div className="min-w-0">
                        <div
                          className="
                            mb-3
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <ServerCog className="h-4 w-4 text-violet-600" />

                          <h3
                            className="
                              text-sm
                              font-black
                              merchant-text
                            "
                          >
                            Next.js backend route
                          </h3>
                        </div>

                        <CodeBlock
                          title="app/api/checkout/route.ts"
                          language="Next.js"
                          code={
                            examples.nextRoute
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <div
                          className="
                            mb-3
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <Globe2 className="h-4 w-4 text-violet-600" />

                          <h3
                            className="
                              text-sm
                              font-black
                              merchant-text
                            "
                          >
                            Browser redirect
                          </h3>
                        </div>

                        <CodeBlock
                          title="checkout-button.ts"
                          language="Browser"
                          code={
                            examples.redirect
                          }
                        />
                      </div>
                    </div>

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        bg-cyan-500/10
                        p-4
                        text-cyan-800

                        dark:text-cyan-300
                      "
                    >
                      <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0" />

                      <div>
                        <p className="text-xs font-black">
                          Idempotency matters
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-6
                            opacity-80
                          "
                        >
                          Use an immutable merchant order ID as the
                          Idempotency-Key so retrying the same request
                          does not create multiple payment orders.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* =========================================
                    VERIFY ORDER
                ========================================== */}

                {activeSection ===
                "verify-order" ? (
                  <div className="space-y-6">
                    <SectionHeading
                      eyebrow={`${environment} integration`}
                      title="Verify the final order state"
                      description="The customer returning to your success page is not proof of payment. Verify the order from your server or process a valid signed webhook."
                      icon={
                        BadgeCheck
                      }
                    />

                    <div
                      className="
                        grid
                        gap-3

                        sm:grid-cols-3
                      "
                    >
                      <InfoCard
                        label="Method"
                        value="GET /orders/:orderId"
                      />

                      <InfoCard
                        label="Required scope"
                        value="orders:read"
                      />

                      <InfoCard
                        label="Successful order"
                        value="status = paid"
                      />
                    </div>

                    <CodeBlock
                      title="verify-order.ts"
                      language="TypeScript"
                      code={
                        examples.verifyOrder
                      }
                    />

                    <div
                      className="
                        grid
                        gap-3

                        md:grid-cols-3
                      "
                    >
                      <VerificationRule
                        label="Reference"
                        value="Match merchantReference with your internal order ID."
                      />

                      <VerificationRule
                        label="Amount"
                        value="Compare the final amount with your trusted database."
                      />

                      <VerificationRule
                        label="Currency"
                        value="Confirm the returned payment currency before fulfilment."
                      />
                    </div>

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        bg-emerald-500/10
                        p-4
                        text-emerald-800

                        dark:text-emerald-300
                      "
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                      <div>
                        <p className="text-xs font-black">
                          Fulfil exactly once
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-6
                            opacity-80
                          "
                        >
                          Your merchant system should update or fulfil
                          the order only once after a trusted final
                          success state is confirmed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* =========================================
                    WEBHOOKS
                ========================================== */}

                {activeSection ===
                "webhooks" ? (
                  <div className="space-y-6">
                    <SectionHeading
                      eyebrow={`${environment} integration`}
                      title="Receive signed webhook events"
                      description="Webhooks let Coffer notify your backend when payment state changes without requiring constant polling."
                      icon={
                        Webhook
                      }
                    />

                    <div
                      className="
                        grid
                        gap-3

                        md:grid-cols-3
                      "
                    >
                      <StepCard
                        number="01"
                        title="Keep raw body"
                        description="Signature verification must use the exact webhook request body."
                        icon={
                          FileKey2
                        }
                      />

                      <StepCard
                        number="02"
                        title="Verify signature"
                        description="Validate the timestamp and signature using the endpoint signing secret."
                        icon={
                          ShieldCheck
                        }
                      />

                      <StepCard
                        number="03"
                        title="Process once"
                        description="Persist the event ID and make webhook handling idempotent."
                        icon={
                          Workflow
                        }
                      />
                    </div>

                    <CodeBlock
                      title="webhook-server.ts"
                      language="Express"
                      code={
                        examples.webhook
                      }
                    />

                    <div
                      className="
                        grid
                        gap-5

                        lg:grid-cols-[minmax(0,1fr)_320px]
                      "
                    >
                      <div
                        className="
                          rounded-[22px]
                          bg-violet-500/5
                          p-5
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <Code2 className="h-4 w-4 text-violet-600" />

                          <h3
                            className="
                              text-sm
                              font-black
                              merchant-text
                            "
                          >
                            Delivery headers
                          </h3>
                        </div>

                        <div
                          className="
                            mt-4
                            grid
                            gap-2

                            sm:grid-cols-2
                          "
                        >
                          {[
                            "Coffer-Event-Id",
                            "Coffer-Event-Type",
                            "Coffer-Timestamp",
                            "Coffer-Signature",
                            "Idempotency-Key",
                          ].map(
                            (
                              header,
                            ) => (
                              <code
                                key={
                                  header
                                }
                                className="
                                  break-all
                                  rounded-xl
                                  bg-violet-500/10
                                  px-3
                                  py-2.5
                                  text-[11px]
                                  font-black
                                  text-violet-700

                                  dark:text-violet-300
                                "
                              >
                                {header}
                              </code>
                            ),
                          )}
                        </div>
                      </div>

                      <div
                        className="
                          flex
                          flex-col
                          justify-between
                          rounded-[22px]
                          bg-[#18092D]
                          p-5
                          text-white
                        "
                      >
                        <div>
                          <Webhook className="h-5 w-5 text-violet-300" />

                          <h3
                            className="
                              mt-4
                              text-sm
                              font-black
                            "
                          >
                            Manage endpoints
                          </h3>

                          <p
                            className="
                              mt-2
                              text-xs
                              leading-6
                              text-violet-100/60
                            "
                          >
                            Create Test or Live endpoints, rotate
                            signing secrets and monitor delivery
                            attempts.
                          </p>
                        </div>

                        <Link
                          href="/dashboard/merchant/webhooks"
                          className="
                            mt-5
                            inline-flex
                            h-10
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-white
                            px-4
                            text-xs
                            font-black
                            text-violet-700
                            transition

                            hover:bg-violet-50
                          "
                        >
                          Open Webhooks

                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* =========================================
                    SECURITY
                ========================================== */}

                {activeSection ===
                "security" ? (
                  <div className="space-y-6">
                    <SectionHeading
                      eyebrow={`${environment} integration`}
                      title="Production security checklist"
                      description="Use server-side secrets, least-privilege API keys, verified webhook signatures and trusted payment verification before fulfilment."
                      icon={
                        ShieldCheck
                      }
                    />

                    <div
                      className="
                        grid
                        gap-3

                        lg:grid-cols-2
                      "
                    >
                      <SecurityItem
                        title="Keep secrets server-side"
                        description="API keys and webhook secrets belong in protected backend environment variables."
                        icon={
                          FileKey2
                        }
                      />

                      <SecurityItem
                        title="Use least privilege"
                        description="Grant each API key only the scopes required by the service using that key."
                        icon={
                          KeyRound
                        }
                      />

                      <SecurityItem
                        title="Verify webhook signatures"
                        description="Reject unsigned or invalid webhook requests before processing their payload."
                        icon={
                          Webhook
                        }
                      />

                      <SecurityItem
                        title="Confirm amount and currency"
                        description="Compare payment values with the trusted order stored in your own database."
                        icon={
                          CircleDollarSign
                        }
                      />

                      <SecurityItem
                        title="Handle events once"
                        description="Persist webhook event IDs and make downstream operations idempotent."
                        icon={
                          Workflow
                        }
                      />

                      <SecurityItem
                        title="Rotate exposed credentials"
                        description="Rotate an API key or webhook secret immediately if it becomes exposed."
                        icon={
                          RefreshCcw
                        }
                      />
                    </div>

                    <div
                      className="
                        relative
                        overflow-hidden
                        rounded-[24px]
                        bg-[#18092D]
                        p-5
                        text-white

                        sm:p-6
                      "
                    >
                      <div
                        className="
                          pointer-events-none
                          absolute
                          -right-14
                          -top-20
                          h-48
                          w-48
                          rounded-full
                          bg-violet-500/25
                          blur-3xl
                        "
                      />

                      <div
                        className="
                          relative
                          flex
                          flex-col
                          gap-5

                          lg:flex-row
                          lg:items-center
                          lg:justify-between
                        "
                      >
                        <div className="max-w-2xl">
                          <div
                            className="
                              inline-flex
                              items-center
                              gap-2
                              text-xs
                              font-black
                              text-violet-300
                            "
                          >
                            <Sparkles className="h-4 w-4" />

                            Ready for production?
                          </div>

                          <p
                            className="
                              mt-2
                              text-xs
                              leading-6
                              text-violet-100/65
                            "
                          >
                            Complete sandbox checkout, confirm webhook
                            delivery, test duplicate handling and make
                            sure the merchant account is eligible for
                            Live API access.
                          </p>
                        </div>

                        <Link
                          href="/dashboard/merchant/verification"
                          className="
                            inline-flex
                            h-11
                            shrink-0
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-white
                            px-4
                            text-sm
                            font-black
                            text-violet-700
                            transition

                            hover:bg-violet-50
                          "
                        >
                          Merchant Verification

                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section
          className="
            rounded-[26px]
            bg-violet-500/5
            p-5

            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5

              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-500/10
                  text-violet-600
                "
              >
                <Workflow className="h-5 w-5" />
              </div>

              <div>
                <h2
                  className="
                    font-black
                    merchant-text
                  "
                >
                  Complete integration flow
                </h2>

                <p
                  className="
                    mt-1
                    max-w-3xl
                    text-xs
                    leading-6
                    merchant-muted
                  "
                >
                  Merchant server creates order → customer completes
                  Coffer checkout → server verifies payment → signed
                  webhook keeps the merchant system synchronized.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                startIntegration
              }
              className="
                inline-flex
                h-11
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-600
                px-5
                text-sm
                font-black
                text-white
                transition

                hover:bg-violet-700
              "
            >
              Start integration

              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   HERO STEP
========================================================= */

function HeroStep({
  number,
  title,
  description,
  icon:
    Icon,
}: {
  number: string;

  title: string;

  description: string;

  icon: LucideIcon;
}) {
  return (
    <motion.div
      whileHover={{
        y:
          -2,
      }}
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-3
        backdrop-blur
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white/10
        "
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.13em]
            text-violet-100/55
          "
        >
          Step {number}
        </p>

        <div
          className="
            mt-0.5
            flex
            flex-wrap
            items-center
            gap-x-1.5
          "
        >
          <span
            className="
              text-xs
              font-black
              text-white
            "
          >
            {title}
          </span>

          <span
            className="
              text-[10px]
              text-violet-100/60
            "
          >
            {description}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   VERIFICATION RULE
========================================================= */

function VerificationRule({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-violet-500/5
        p-4
      "
    >
      <div
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-xl
          bg-emerald-500/10
          text-emerald-600
        "
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>

      <p
        className="
          mt-3
          text-xs
          font-black
          merchant-text
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xs
          leading-5
          merchant-muted
        "
      >
        {value}
      </p>
    </div>
  );
}