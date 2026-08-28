"use client";

import {
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  WalletCards,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface PremiumWalletCardProps {
  walletId: string;

  balance: number;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PremiumWalletCard({
  walletId,
  balance,
}: PremiumWalletCardProps) {
  const [
    showBalance,
    setShowBalance,
  ] = useState(true);

  const [
    copied,
    setCopied,
  ] = useState(false);

  /* =========================================================
     COPY WALLET ID
  ========================================================== */

  const handleCopyWalletId =
    async () => {
      if (
        !walletId
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          walletId
        );

        setCopied(
          true
        );

        window.setTimeout(
          () => {
            setCopied(
              false
            );
          },
          1800
        );
      } catch (error) {
        console.error(
          "Copy wallet ID failed:",
          error
        );
      }
    };

  /* =========================================================
     FORMAT BALANCE
  ========================================================== */

  const formattedBalance =
    Number(
      balance || 0
    ).toLocaleString(
      "en-BD",
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          2,
      }
    );

  /* =========================================================
     UI
  ========================================================== */

  return (
    <section
      className="
        relative
        isolate
        overflow-hidden

        rounded-[32px]

        border
        border-[#78C8F4]/15

        bg-gradient-to-br
        from-[#07182B]
        via-[#0C355B]
        to-[#12659B]

        p-5
        text-white

        shadow-[0_30px_75px_rgba(10,53,91,0.25)]

        sm:p-7
        lg:p-8
      "
    >
      {/* =====================================================
          AURORA BACKGROUND
      ====================================================== */}

      <motion.div
        animate={{
          x: [
            0,
            30,
            0,
          ],

          y: [
            0,
            18,
            0,
          ],

          scale: [
            1,
            1.12,
            1,
          ],
        }}
        transition={{
          duration:
            12,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -left-32
          -top-40

          h-[430px]
          w-[430px]

          rounded-full

          bg-[#31C7F5]/15

          blur-[110px]
        "
      />

      <motion.div
        animate={{
          x: [
            0,
            -30,
            0,
          ],

          y: [
            0,
            -20,
            0,
          ],
        }}
        transition={{
          duration:
            14,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-44
          right-[15%]

          h-[400px]
          w-[400px]

          rounded-full

          bg-[#2563EB]/20

          blur-[120px]
        "
      />

      {/* TOP LIGHT */}

      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white/40
          to-transparent
        "
      />

      {/* DECORATIVE ORBITS */}

      <div
        className="
          pointer-events-none
          absolute
          -right-14
          -top-20

          h-64
          w-64

          rounded-full

          border
          border-white/[0.05]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-14
          top-12

          h-32
          w-32

          rounded-full

          border
          border-white/[0.05]
        "
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-10
        "
      >
        <div
          className="
            flex
            flex-col
            gap-9

            xl:flex-row
            xl:items-stretch
            xl:justify-between
          "
        >
          {/* =================================================
              BALANCE SIDE
          ================================================== */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-center
                gap-4
              "
            >
              <div
                className="
                  relative

                  flex
                  h-[52px]
                  w-[52px]
                  shrink-0
                  items-center
                  justify-center

                  overflow-hidden

                  rounded-[17px]

                  border
                  border-white/10

                  bg-white/[0.08]

                  shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]

                  backdrop-blur-xl
                "
              >
                <div
                  className="
                    absolute
                    inset-0

                    bg-gradient-to-br
                    from-[#7DDFFF]/15
                    to-transparent
                  "
                />

                <WalletCards
                  className="
                    relative
                    h-[23px]
                    w-[23px]

                    text-[#87E4FF]
                  "
                />
              </div>

              <div>
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-extrabold
                      uppercase

                      tracking-[0.2em]

                      text-[#8EDFFF]
                    "
                  >
                    Available Balance
                  </p>

                  <span
                    className="
                      h-1
                      w-1

                      rounded-full

                      bg-[#75DFFF]

                      shadow-[0_0_8px_rgba(117,223,255,0.85)]
                    "
                  />

                  <span
                    className="
                      text-[9px]
                      font-bold
                      uppercase

                      tracking-[0.15em]

                      text-white/45
                    "
                  >
                    BDT
                  </span>
                </div>

                <p
                  className="
                    mt-1

                    text-[12px]
                    font-semibold

                    text-white/55
                  "
                >
                  Coffer Personal Wallet
                </p>
              </div>
            </div>

            {/* =================================================
                BALANCE
            ================================================== */}

            <div
              className="
                mt-8
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-4
                "
              >
                <span
                  className="
                    text-[27px]
                    font-black

                    text-[#9AE7FF]

                    sm:text-[32px]
                  "
                >
                  ৳
                </span>

                {/* BALANCE BOX */}

                <div
                  className="
                    relative

                    flex
                    h-[66px]
                    min-w-[215px]
                    items-center

                    sm:min-w-[270px]
                  "
                >
                  <AnimatePresence
                    mode="wait"
                    initial={
                      false
                    }
                  >
                    {showBalance ? (
                      <motion.div
                        key="visible-balance"

                        initial={{
                          opacity:
                            0,

                          y:
                            12,

                          scale:
                            0.96,

                          filter:
                            "blur(10px)",
                        }}

                        animate={{
                          opacity:
                            1,

                          y:
                            0,

                          scale:
                            1,

                          filter:
                            "blur(0px)",
                        }}

                        exit={{
                          opacity:
                            0,

                          y:
                            -12,

                          scale:
                            0.97,

                          filter:
                            "blur(10px)",
                        }}

                        transition={{
                          duration:
                            0.42,

                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}

                        className="
                          bg-gradient-to-r
                          from-white
                          via-[#ECFAFF]
                          to-[#9FEAFF]

                          bg-clip-text

                          text-[43px]
                          font-black
                          leading-none

                          tracking-[-0.045em]

                          text-transparent

                          sm:text-[55px]
                        "
                      >
                        {
                          formattedBalance
                        }
                      </motion.div>
                    ) : (
                      <motion.div
                        key="hidden-balance"

                        initial={{
                          opacity:
                            0,

                          scale:
                            0.9,

                          filter:
                            "blur(8px)",
                        }}

                        animate={{
                          opacity:
                            1,

                          scale:
                            1,

                          filter:
                            "blur(0px)",
                        }}

                        exit={{
                          opacity:
                            0,

                          scale:
                            0.9,

                          filter:
                            "blur(8px)",
                        }}

                        className="
                          flex
                          items-center
                          gap-2.5
                        "
                      >
                        {[
                          0,
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (
                            item
                          ) => (
                            <motion.span
                              key={
                                item
                              }

                              animate={{
                                height: [
                                  8,
                                  20,
                                  8,
                                ],

                                opacity: [
                                  0.4,
                                  1,
                                  0.4,
                                ],
                              }}

                              transition={{
                                duration:
                                  1.3,

                                repeat:
                                  Infinity,

                                delay:
                                  item *
                                  0.09,

                                ease:
                                  "easeInOut",
                              }}

                              className="
                                w-[9px]

                                rounded-full

                                bg-[#A9EEFF]

                                shadow-[0_0_14px_rgba(169,238,255,0.45)]
                              "
                            />
                          )
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* =================================================
                    PRIVACY BUTTON
                ================================================== */}

                <motion.button
                  type="button"

                  onClick={() =>
                    setShowBalance(
                      (
                        current
                      ) =>
                        !current
                    )
                  }

                  whileHover={{
                    scale:
                      1.04,
                  }}

                  whileTap={{
                    scale:
                      0.93,
                  }}

                  aria-label={
                    showBalance
                      ? "Hide balance"
                      : "Show balance"
                  }

                  className="
                    group
                    relative

                    flex
                    h-11
                    items-center
                    gap-2

                    overflow-hidden

                    rounded-[14px]

                    border
                    border-white/10

                    bg-white/[0.08]

                    px-3.5

                    text-[#BCEFFF]

                    shadow-[0_8px_22px_rgba(0,0,0,0.10)]

                    backdrop-blur-xl
                  "
                >
                  {!showBalance && (
                    <motion.span
                      animate={{
                        scale: [
                          0.8,
                          1.8,
                        ],

                        opacity: [
                          0.35,
                          0,
                        ],
                      }}

                      transition={{
                        duration:
                          1.6,

                        repeat:
                          Infinity,
                      }}

                      className="
                        absolute
                        left-[10px]

                        h-7
                        w-7

                        rounded-full

                        border
                        border-[#89E8FF]
                      "
                    />
                  )}

                  <AnimatePresence
                    mode="wait"
                    initial={
                      false
                    }
                  >
                    <motion.span
                      key={
                        showBalance
                          ? "eye"
                          : "eye-off"
                      }

                      initial={{
                        opacity:
                          0,

                        rotate:
                          -60,

                        scale:
                          0.6,
                      }}

                      animate={{
                        opacity:
                          1,

                        rotate:
                          0,

                        scale:
                          1,
                      }}

                      exit={{
                        opacity:
                          0,

                        rotate:
                          60,

                        scale:
                          0.6,
                      }}

                      className="
                        relative
                        z-10
                        flex
                      "
                    >
                      {showBalance ? (
                        <Eye
                          className="
                            h-[17px]
                            w-[17px]
                          "
                        />
                      ) : (
                        <EyeOff
                          className="
                            h-[17px]
                            w-[17px]
                          "
                        />
                      )}
                    </motion.span>
                  </AnimatePresence>

                  <span
                    className="
                      relative
                      z-10

                      hidden

                      text-[9px]
                      font-extrabold
                      uppercase

                      tracking-[0.12em]

                      sm:block
                    "
                  >
                    {showBalance
                      ? "Hide"
                      : "Reveal"}
                  </span>
                </motion.button>
              </div>

              {/* PRIVACY STATUS */}

              <AnimatePresence
                mode="wait"
                initial={
                  false
                }
              >
                <motion.div
                  key={
                    showBalance
                      ? "visible"
                      : "private"
                  }

                  initial={{
                    opacity:
                      0,

                    x:
                      -6,
                  }}

                  animate={{
                    opacity:
                      1,

                    x:
                      0,
                  }}

                  exit={{
                    opacity:
                      0,

                    x:
                      6,
                  }}

                  className="
                    mt-3

                    flex
                    items-center
                    gap-2
                  "
                >
                  <LockKeyhole
                    className="
                      h-3
                      w-3

                      text-[#8EE7FF]
                    "
                  />

                  <span
                    className="
                      text-[9px]
                      font-semibold

                      text-white/45
                    "
                  >
                    {showBalance
                      ? "Tap Hide to activate privacy mode"
                      : "Privacy mode enabled — your balance is protected"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* =================================================
                BADGES
            ================================================== */}

            <div
              className="
                mt-7

                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              <div
                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  border
                  border-emerald-400/20

                  bg-emerald-400/10

                  px-3.5
                  py-1.5

                  text-[10px]
                  font-bold

                  text-emerald-200
                "
              >
                <span
                  className="
                    relative
                    flex
                    h-2
                    w-2
                  "
                >
                  <span
                    className="
                      absolute
                      inline-flex
                      h-full
                      w-full

                      animate-ping

                      rounded-full

                      bg-emerald-400

                      opacity-60
                    "
                  />

                  <span
                    className="
                      relative
                      inline-flex
                      h-2
                      w-2

                      rounded-full

                      bg-emerald-400
                    "
                  />
                </span>

                Wallet Active
              </div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-full

                  border
                  border-white/10

                  bg-white/[0.06]

                  px-3.5
                  py-1.5

                  text-[10px]
                  font-bold

                  text-[#CDEBFF]
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5

                    rounded-full

                    bg-[#72DFFF]
                  "
                />

                Bangladeshi Taka
              </div>
            </div>
          </div>

          {/* =================================================
              WALLET ID SIDE
          ================================================== */}

          <div
            className="
              flex
              w-full
              items-stretch

              xl:w-[380px]
              xl:shrink-0
            "
          >
            <div
              className="
                relative
                w-full

                overflow-hidden

                rounded-[24px]

                border
                border-white/10

                bg-white/[0.055]

                p-5

                shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]

                backdrop-blur-2xl

                sm:p-6
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-16
                  -top-16

                  h-40
                  w-40

                  rounded-full

                  bg-[#5DDCFF]/10

                  blur-3xl
                "
              />

              <div
                className="
                  relative
                  z-10
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[9px]
                        font-extrabold
                        uppercase

                        tracking-[0.18em]

                        text-[#8DE4FF]/70
                      "
                    >
                      Wallet Identity
                    </p>

                    <h3
                      className="
                        mt-1.5

                        text-base
                        font-extrabold

                        tracking-[-0.02em]

                        text-white
                      "
                    >
                      Personal Wallet ID
                    </h3>
                  </div>

                  <motion.button
                    type="button"

                    onClick={
                      handleCopyWalletId
                    }

                    whileHover={{
                      scale:
                        1.06,
                    }}

                    whileTap={{
                      scale:
                        0.92,
                    }}

                    aria-label="Copy wallet ID"

                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center

                      rounded-[13px]

                      border
                      border-white/10

                      bg-white/[0.08]

                      text-white
                    "
                  >
                    <AnimatePresence
                      mode="wait"
                      initial={
                        false
                      }
                    >
                      <motion.span
                        key={
                          copied
                            ? "copied"
                            : "copy"
                        }

                        initial={{
                          opacity:
                            0,

                          scale:
                            0.6,

                          rotate:
                            -15,
                        }}

                        animate={{
                          opacity:
                            1,

                          scale:
                            1,

                          rotate:
                            0,
                        }}

                        exit={{
                          opacity:
                            0,

                          scale:
                            0.6,

                          rotate:
                            15,
                        }}

                        className="flex"
                      >
                        {copied ? (
                          <CheckCircle2
                            className="
                              h-[18px]
                              w-[18px]

                              text-emerald-300
                            "
                          />
                        ) : (
                          <Copy
                            className="
                              h-[18px]
                              w-[18px]
                            "
                          />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>

                {/* WALLET ID */}

                <div
                  className="
                    group
                    relative

                    mt-6
                  "
                >
                  <div
                    className="
                      absolute
                      -inset-0.5

                      rounded-[17px]

                      bg-gradient-to-r
                      from-[#5EDFFF]/15
                      to-[#4C8DFF]/15

                      opacity-0

                      blur

                      transition
                      duration-500

                      group-hover:opacity-100
                    "
                  />

                  <div
                    className="
                      relative

                      rounded-[17px]

                      border
                      border-white/[0.08]

                      bg-[#041425]/40

                      p-4
                    "
                  >
                    <p
                      className="
                        break-all

                        font-mono

                        text-[12px]
                        font-semibold

                        leading-5

                        tracking-[0.035em]

                        text-[#E8F8FF]

                        sm:text-[13px]
                      "
                    >
                      {
                        walletId
                      }
                    </p>
                  </div>
                </div>

                {/* STATUS */}

                <div
                  className="
                    mt-5

                    flex
                    min-h-5
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-medium

                      text-white/35
                    "
                  >
                    Unique wallet identifier
                  </p>

                  <AnimatePresence>
                    {copied && (
                      <motion.span
                        initial={{
                          opacity:
                            0,

                          x:
                            8,
                        }}

                        animate={{
                          opacity:
                            1,

                          x:
                            0,
                        }}

                        exit={{
                          opacity:
                            0,

                          x:
                            8,
                        }}

                        className="
                          inline-flex
                          items-center
                          gap-1.5

                          text-[9px]
                          font-bold

                          text-emerald-300
                        "
                      >
                        <CheckCircle2
                          className="
                            h-3
                            w-3
                          "
                        />

                        Copied
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}