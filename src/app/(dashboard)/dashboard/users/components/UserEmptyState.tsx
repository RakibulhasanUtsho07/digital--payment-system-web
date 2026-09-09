"use client";

import React from "react";

import {
  motion,
} from "framer-motion";

import {
  SearchX,
  Sparkles,
  Users,
} from "lucide-react";

interface UserEmptyStateProps {
  filtered: boolean;
  onClear?: () => void;
}

export default function UserEmptyState({
  filtered,
  onClear,
}: UserEmptyStateProps) {
  const Icon =
    filtered
      ? SearchX
      : Users;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        relative
        flex
        min-h-72
        flex-col
        items-center
        justify-center
        overflow-hidden
        px-6
        py-10
        text-center
      "
    >
      {/* =================================================
          DECORATIVE BACKGROUND
      ================================================= */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-56
          w-56
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-indigo-500/5
          blur-3xl
        "
      />

      <motion.div
        animate={{
          y: [
            0,
            -4,
            0,
          ],
          rotate: [
            0,
            2,
            -2,
            0,
          ],
        }}
        transition={{
          duration: 4,
          repeat:
            Infinity,
          ease: "easeInOut",
        }}
        className="
          relative
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-[22px]
          bg-gradient-to-br
          from-indigo-600
          to-violet-600
          text-white
          shadow-[0_16px_35px_rgba(79,70,229,.2)]
        "
      >
        <Icon className="h-7 w-7" />

        <motion.span
          animate={{
            opacity: [
              0.2,
              0.65,
              0.2,
            ],
            scale: [
              0.9,
              1.08,
              0.9,
            ],
          }}
          transition={{
            duration: 2.5,
            repeat:
              Infinity,
            ease: "easeInOut",
          }}
          className="
            absolute
            inset-0
            rounded-[22px]
            border
            border-violet-300/30
          "
        />
      </motion.div>

      {/* =================================================
          TITLE
      ================================================= */}

      <h3 className="relative mt-5 text-lg font-black tracking-tight text-card-foreground">
        {filtered
          ? "No users match these filters"
          : "No users yet"}
      </h3>

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <p className="relative mt-2 max-w-md text-xs leading-6 text-muted-foreground">
        {filtered
          ? "Try changing your search or clearing one of the active filters to discover more accounts."
          : "Create the first account to begin managing users, verification, wallet access and security."}
      </p>

      {/* =================================================
          ACTION
      ================================================= */}

      {filtered &&
        onClear && (
          <motion.button
            type="button"
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale:
                0.985,
            }}
            onClick={
              onClear
            }
            className="
              relative
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-indigo-600
              to-violet-600
              px-4
              py-2.5
              text-xs
              font-black
              text-white
              shadow-lg
              shadow-indigo-500/15
              transition
              hover:from-indigo-700
              hover:to-violet-700
            "
          >
            <Sparkles className="h-3.5 w-3.5" />

            Clear filters
          </motion.button>
        )}
    </motion.div>
  );
}