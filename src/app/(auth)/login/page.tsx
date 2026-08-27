"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;

  role:
    | "user"
    | "admin";

  kycStatus:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";
  /* =========================================================
     LOGIN LOGIC
     SAME LOGIC AS YOUR FIRST WORKING CODE
  ========================================================== */

  // const handleSubmit = async (
  //   e: FormEvent<HTMLFormElement>
  // ) => {
  //   e.preventDefault();

  //   setErrorMessage("");

  //   const normalizedEmail =
  //     email
  //       .trim()
  //       .toLowerCase();

  //   if (!normalizedEmail) {
  //     setErrorMessage(
  //       "Please enter your email address."
  //     );

  //     return;
  //   }

  //   if (!password) {
  //     setErrorMessage(
  //       "Please enter your password."
  //     );

  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     console.log(
  //       "LOGIN API:",
  //       "https://digital-wallet-backend-five.vercel.app/api/auth/login"
  //     );

  //     const response =
  //       await fetch(
  //         "https://digital-wallet-backend-five.vercel.app/api/auth/login",
  //         {
  //           method:
  //             "POST",

  //           headers: {
  //             "Content-Type":
  //               "application/json",
  //           },

  //           credentials:
  //             "include",

  //           body:
  //             JSON.stringify({
  //               email:
  //                 normalizedEmail,

  //               password,
  //             }),
  //         }
  //       );

  //     const data:
  //       LoginResponse =
  //         await response.json();

  //     console.log(
  //       "LOGIN STATUS:",
  //       response.status
  //     );

  //     console.log(
  //       "LOGIN RESPONSE:",
  //       data
  //     );

  //     if (
  //       !response.ok ||
  //       !data.success
  //     ) {
  //       throw new Error(
  //         data.message ||
  //           "Login failed."
  //       );
  //     }

  //     if (!data.user) {
  //       throw new Error(
  //         "User information was not returned by the server."
  //       );
  //     }

  //     localStorage.setItem(
  //       "auth_user",
  //       JSON.stringify(
  //         data.user
  //       )
  //     );

  //     localStorage.setItem(
  //       "is_authenticated",
  //       "true"
  //     );

  //     router.replace(
  //       "/dashboard"
  //     );
  //   } catch (error) {
  //     console.error(
  //       "LOGIN ERROR:",
  //       error
  //     );

  //     setErrorMessage(
  //       error instanceof Error
  //         ? error.message
  //         : "Unable to login. Please try again."
  //     );
  //   } finally {
  //     setIsLoading(
  //       false
  //     );
  //   }
  // };
const handleSubmit = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  if (isLoading) {
    return;
  }

  setErrorMessage("");

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  if (!normalizedEmail) {
    setErrorMessage(
      "Please enter your email address."
    );

    return;
  }

  if (!password) {
    setErrorMessage(
      "Please enter your password."
    );

    return;
  }

  setIsLoading(true);

  try {
    const loginUrl =
      `${API_URL}/auth/login`;

    console.log(
      "LOGIN API:",
      loginUrl
    );

    console.log(
      "LOGIN REQUEST:",
      {
        email: normalizedEmail,
        passwordLength:
          password.length,
      }
    );

    const response =
      await fetch(
        loginUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          credentials:
            "include",

          body:
            JSON.stringify({
              email:
                normalizedEmail,

              password,
            }),
        }
      );

    let data:
      LoginResponse | null =
        null;

    try {
      data =
        (await response.json()) as LoginResponse;
    } catch {
      throw new Error(
        "Invalid response from server."
      );
    }

    console.log(
      "LOGIN STATUS:",
      response.status
    );

    console.log(
      "LOGIN RESPONSE:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.message ||
          `Login failed with status ${response.status}.`
      );
    }

    if (
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Login failed."
      );
    }

    if (!data.user) {
      throw new Error(
        "User information was not returned by the server."
      );
    }

    localStorage.setItem(
      "auth_user",
      JSON.stringify(
        data.user
      )
    );

    localStorage.setItem(
      "is_authenticated",
      "true"
    );

    router.replace(
      "/dashboard"
    );

    router.refresh();
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    if (
      error instanceof TypeError
    ) {
      setErrorMessage(
        "Unable to connect to the server. Please make sure the backend is running."
      );

      return;
    }

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to login. Please try again."
    );
  } finally {
    setIsLoading(
      false
    );
  }
};
  /* =========================================================
     UI
  ========================================================== */

  return (
    <div
      className="
        relative
        z-20
        w-full
        pointer-events-auto
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
      >
        {/* ICON */}

        <motion.div
          whileHover={{
            scale: 1.06,
            rotate: -4,
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 18,
          }}
          className="
            mb-4

            flex
            h-[44px]
            w-[44px]
            items-center
            justify-center

            rounded-[14px]

            border
            border-[#D9E8F6]

            bg-gradient-to-br
            from-[#F3F9FF]
            to-[#EAF4FF]

            text-[#1F5EA8]

            shadow-[0_10px_24px_rgba(31,94,168,0.08)]
          "
        >
          <Fingerprint
            className="
              h-[20px]
              w-[20px]
            "
          />
        </motion.div>

        {/* EYEBROW */}

        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.19em]

            text-[#1762AC]
          "
        >
          Secure account access
        </p>

        {/* TITLE */}

        <h1
          className="
            mt-2

            text-[32px]
            font-black
            leading-none
            tracking-[-0.045em]

            text-[#102A43]

            sm:text-[34px]
          "
        >
          Sign in
        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            mt-4

            max-w-[390px]

            text-[12px]
            font-medium
            leading-[1.9]

            text-[#718296]

            sm:text-[13px]
          "
        >
          Enter your account credentials
          to continue to your secure
          wallet.
        </p>
      </motion.div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
              y: -7,
            }}
            animate={{
              opacity: 1,
              height: "auto",
              y: 0,
            }}
            exit={{
              opacity: 0,
              height: 0,
              y: -5,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              overflow-hidden
            "
          >
            <div
              className="
                mt-5

                flex
                items-start
                gap-2.5

                rounded-[14px]

                border
                border-rose-200

                bg-rose-50

                px-3.5
                py-3

                text-[11px]
                font-semibold

                text-rose-600
              "
            >
              <AlertCircle
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                "
              />

              <span>
                {errorMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          FORM
      ====================================================== */}

      <motion.form
        onSubmit={
          handleSubmit
        }
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.07,
          duration: 0.45,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="
          relative
          z-30

          mt-7
          space-y-5

          pointer-events-auto
        "
      >
        {/* ===================================================
            EMAIL
        ==================================================== */}

        <div
          className="
            relative
            z-20
          "
        >
          <label
            htmlFor="login-email"
            className="
              mb-2
              block

              cursor-pointer

              text-[10px]
              font-extrabold

              text-[#344A60]
            "
          >
            Email Address
          </label>

          <div
            className="
              group
              relative
            "
          >
            <Mail
              className="
                pointer-events-none

                absolute
                left-4
                top-1/2
                z-10

                h-4
                w-4

                -translate-y-1/2

                text-[#93A5B8]

                transition-colors

                group-focus-within:text-[#1F5EA8]
              "
            />

            <input
              id="login-email"
              name="email"
              type="email"

              value={email}

              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }

              placeholder="name@example.com"

              autoComplete="email"

              disabled={
                isLoading
              }

              required

              className="
                relative
                z-20

                h-[53px]
                w-full

                rounded-[14px]

                border
                border-[#D6E1EB]

                bg-[#F7F9FC]

                pl-11
                pr-4

                text-[13px]
                font-semibold

                text-[#18334B]

                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:text-[#A0AFC0]

                hover:border-[#C4D4E3]

                focus:border-[#3E8FD9]
                focus:bg-white

                focus:ring-4
                focus:ring-blue-500/[0.07]

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />
          </div>
        </div>

        {/* ===================================================
            PASSWORD
        ==================================================== */}

        <div
          className="
            relative
            z-20
          "
        >
          <div
            className="
              mb-2

              flex
              items-center
              justify-between
              gap-4
            "
          >
            <label
              htmlFor="login-password"
              className="
                cursor-pointer

                text-[10px]
                font-extrabold

                text-[#344A60]
              "
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="
                text-[9px]
                font-extrabold

                text-[#1762AC]

                transition-colors

                hover:text-[#104C85]
              "
            >
              Forgot password?
            </Link>
          </div>

          <div
            className="
              group
              relative
            "
          >
            <KeyRound
              className="
                pointer-events-none

                absolute
                left-4
                top-1/2
                z-10

                h-4
                w-4

                -translate-y-1/2

                text-[#93A5B8]

                transition-colors

                group-focus-within:text-[#1F5EA8]
              "
            />

            <input
              id="login-password"
              name="password"

              type={
                showPassword
                  ? "text"
                  : "password"
              }

              value={
                password
              }

              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }

              placeholder="Enter your password"

              autoComplete="current-password"

              required

              disabled={
                isLoading
              }

              className="
                relative
                z-20

                h-[53px]
                w-full

                rounded-[14px]

                border
                border-[#D6E1EB]

                bg-[#F7F9FC]

                pl-11
                pr-12

                text-[13px]
                font-semibold

                text-[#18334B]

                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:text-[#A0AFC0]

                hover:border-[#C4D4E3]

                focus:border-[#3E8FD9]
                focus:bg-white

                focus:ring-4
                focus:ring-blue-500/[0.07]

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

            {/* SHOW / HIDE */}

            <motion.button
              type="button"

              disabled={
                isLoading
              }

              whileTap={{
                scale: 0.86,
              }}

              onClick={() =>
                setShowPassword(
                  (current) =>
                    !current
                )
              }

              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }

              className="
                absolute
                right-3
                top-1/2
                z-30

                flex
                h-8
                w-8

                -translate-y-1/2

                items-center
                justify-center

                rounded-lg

                text-[#92A4B8]

                transition-all

                hover:bg-[#EEF6FF]
                hover:text-[#1F5EA8]

                disabled:pointer-events-none
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
                    showPassword
                      ? "hide"
                      : "show"
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.75,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.75,
                  }}
                  transition={{
                    duration: 0.14,
                  }}
                >
                  {showPassword ? (
                    <EyeOff
                      className="
                        h-4
                        w-4
                      "
                    />
                  ) : (
                    <Eye
                      className="
                        h-4
                        w-4
                      "
                    />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ===================================================
            SUBMIT
        ==================================================== */}

        <motion.button
          type="submit"

          disabled={
            isLoading
          }

          whileHover={
            isLoading
              ? undefined
              : {
                  y: -2,
                }
          }

          whileTap={
            isLoading
              ? undefined
              : {
                  scale:
                    0.985,
                }
          }

          className="
            group

            relative
            z-30

            flex
            h-[52px]
            w-full

            items-center
            justify-center
            gap-2

            overflow-hidden

            rounded-[14px]

            bg-gradient-to-r
            from-[#1D5A91]
            via-[#2268A9]
            to-[#2D86CB]

            text-[13px]
            font-extrabold

            text-white

            shadow-[0_17px_35px_rgba(31,94,168,0.24)]

            transition-all

            hover:shadow-[0_20px_42px_rgba(31,94,168,0.30)]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {/* LEFT GLASS SHAPE */}

          {!isLoading && (
            <motion.span
              aria-hidden="true"

              initial={{
                x: 0,
              }}

              whileHover={{
                x: 6,
              }}

              className="
                pointer-events-none

                absolute
                bottom-0
                left-0
                top-0

                w-[22px]

                skew-x-[-12deg]

                bg-white/[0.08]
              "
            />
          )}

          {/* LIGHT SWEEP */}

          {!isLoading && (
            <span
              className="
                pointer-events-none

                absolute
                -left-16
                top-0

                h-full
                w-20

                -skew-x-12

                bg-white/[0.10]

                transition-transform
                duration-700

                group-hover:translate-x-[560px]
              "
            />
          )}

          {isLoading ? (
            <>
              <Loader2
                className="
                  relative
                  h-4
                  w-4
                  animate-spin
                "
              />

              <span className="relative">
                Signing in...
              </span>
            </>
          ) : (
            <>
              <span className="relative">
                Sign In
              </span>

              <ArrowRight
                className="
                  relative

                  h-4
                  w-4

                  transition-transform

                  group-hover:translate-x-1
                "
              />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* =====================================================
          CREATE ACCOUNT
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 7,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.18,
          duration: 0.4,
        }}
      >
        <p
          className="
            mt-7

            text-center

            text-[11px]
            font-medium

            text-[#78899B]
          "
        >
          Don&apos;t have an account?{" "}

          <Link
            href="/register"
            className="
              font-extrabold
              text-[#1762AC]

              transition-colors

              hover:text-[#104B82]
            "
          >
            Create account
          </Link>
        </p>

        {/* SECURITY */}

        <div
          className="
            mt-5

            flex
            items-center
            justify-center
            gap-2

            text-[9px]
            font-semibold

            text-[#9AA8B8]
          "
        >
          <ShieldCheck
            className="
              h-3.5
              w-3.5

              text-emerald-600
            "
          />

          Your account data stays private
        </div>
      </motion.div>
    </div>
  );
}