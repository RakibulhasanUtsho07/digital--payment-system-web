"use client";

import React, {
  useEffect,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  X,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface UserModalShellProps {
  open: boolean;
  onClose: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

interface ModalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
}

/* =========================================================
   MODAL SHELL
========================================================= */

export default function UserModalShell({
  open,
  onClose,
  icon: Icon,
  title,
  description,
  children,
  footer,
}: UserModalShellProps) {
  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.18,
          }}
          className="
            fixed
            inset-0
            z-[120]
            grid
            place-items-center
            bg-slate-950/55
            p-4
            backdrop-blur-md
          "
        >
          {/* =================================================
              BACKDROP
          ================================================= */}

          <motion.button
            type="button"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={
              onClose
            }
            className="
              absolute
              inset-0
              cursor-default
              focus:outline-none
            "
            aria-label="Close dialog"
          />

          {/* =================================================
              DIALOG
          ================================================= */}

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 24,
              scale: 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            className="
              relative
              z-10
              flex
              max-h-[90vh]
              w-full
              max-w-lg
              flex-col
              overflow-hidden
              rounded-[28px]
              border
              border-border
              bg-card
              text-card-foreground
              shadow-[0_30px_100px_rgba(15,23,42,.28)]
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <header
              className="
                relative
                shrink-0
                overflow-hidden
                bg-gradient-to-br
                from-indigo-950
                via-violet-900
                to-indigo-800
                p-5
                text-white
                sm:p-6
              "
            >
              {/* ambient glow */}

              <motion.div
                className="
                  pointer-events-none
                  absolute
                  -right-14
                  -top-14
                  h-40
                  w-40
                  rounded-full
                  bg-violet-400/20
                  blur-3xl
                "
                animate={{
                  scale: [
                    0.9,
                    1.12,
                    0.9,
                  ],
                  opacity: [
                    0.25,
                    0.55,
                    0.25,
                  ],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  opacity-[0.07]
                "
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
                  backgroundSize:
                    "30px 30px",
                }}
              />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <motion.span
                    whileHover={{
                      scale: 1.05,
                      rotate: -3,
                    }}
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/10
                      text-violet-100
                      shadow-[inset_0_1px_0_rgba(255,255,255,.12)]
                    "
                  >
                    <Icon className="h-5 w-5" />
                  </motion.span>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/55">
                      User operations
                    </p>

                    <h2
                      id="user-modal-title"
                      className="
                        mt-1
                        truncate
                        text-lg
                        font-black
                        tracking-tight
                      "
                    >
                      {title}
                    </h2>

                    <p className="mt-1 max-w-md text-xs leading-5 text-violet-100/65">
                      {description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/10
                    text-white
                    transition
                    hover:bg-white/15
                  "
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* =================================================
                BODY
            ================================================= */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                p-5
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
                sm:p-6
              "
            >
              {children}
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            {footer && (
              <footer
                className="
                  shrink-0
                  border-t
                  border-border
                  bg-muted/30
                  p-4
                "
              >
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {footer}
                </div>
              </footer>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   MODAL BUTTON
========================================================= */

export function ModalButton({
  children,
  onClick,
  type = "button",
  tone = "primary",
  disabled = false,
}: ModalButtonProps) {
  const classes =
    tone === "danger"
      ? `
        bg-[var(--dashboard-danger)]
        text-white
        hover:brightness-95
        shadow-sm
      `
      : tone === "secondary"
        ? `
          border
          border-border
          bg-card
          text-muted-foreground
          hover:bg-muted
          hover:text-foreground
        `
        : `
          bg-gradient-to-r
          from-indigo-600
          to-violet-600
          text-white
          shadow-[0_10px_25px_rgba(79,70,229,.18)]
          hover:from-indigo-700
          hover:to-violet-700
        `;

  return (
    <motion.button
      type={type}
      whileHover={
        disabled
          ? undefined
          : {
              y: -1,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale: 0.985,
            }
      }
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className={`
        inline-flex
        h-11
        items-center
        justify-center
        rounded-xl
        px-4
        text-xs
        font-black
        transition-all
        focus:outline-none
        focus:ring-4
        focus:ring-indigo-500/10
        disabled:cursor-not-allowed
        disabled:opacity-45
        ${classes}
      `}
    >
      {children}
    </motion.button>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {required && (
          <span className="ml-1 text-[var(--dashboard-danger)]">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        required={
          required
        }
        autoComplete={
          autoComplete
        }
        className="
          h-11
          w-full
          rounded-xl
          border
          border-border
          bg-muted/30
          px-3.5
          text-sm
          font-medium
          text-foreground
          outline-none
          transition-all
          placeholder:text-muted-foreground/60
          focus:border-[var(--dashboard-primary)]
          focus:bg-card
          focus:ring-4
          focus:ring-[var(--dashboard-primary)]/10
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      />
    </label>
  );
}