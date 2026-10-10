"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

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

type TwoFactorMethod =
  | "email"
  | "sms"
  | "app";

type LoginStep =
  | "credentials"
  | "two_factor";

interface ApiFailureResponse {
  success: false;
  message?: string;
  code?: string;
  attemptsRemaining?: number;
}

interface LoginSuccessResponse {
  success: true;
  message: string;
  requiresTwoFactor?: false;
  user: AuthUser;
}

interface LoginChallengeResponse {
  success: true;
  message: string;
  requiresTwoFactor: true;
  challengeId: string;
  method: TwoFactorMethod;
  target?: string;
  expiresInSeconds?: number;
}

type LoginResponse =
  | LoginSuccessResponse
  | LoginChallengeResponse
  | ApiFailureResponse;

type TwoFactorVerificationResponse =
  | LoginSuccessResponse
  | ApiFailureResponse;

const API_URL =
  "/api/backend";

function isLoginChallenge(
  data: LoginResponse,
): data is LoginChallengeResponse {
  return (
    data.success === true &&
    "requiresTwoFactor" in data &&
    data.requiresTwoFactor === true
  );
}

function isLoginSuccess(
  data:
    | LoginResponse
    | TwoFactorVerificationResponse,
): data is LoginSuccessResponse {
  return (
    data.success === true &&
    "user" in data &&
    Boolean(data.user)
  );
}

async function readJsonResponse<T>(
  response: Response,
): Promise<T> {
  const data =
    await response
      .json()
      .catch(() => null);

  if (
    !data ||
    typeof data !== "object"
  ) {
    throw new Error(
      "Invalid response from server.",
    );
  }

  return data as T;
}

function getMethodLabel(
  method: TwoFactorMethod,
): string {
  if (method === "sms") {
    return "SMS";
  }

  if (method === "app") {
    return "authenticator app";
  }

  return "email";
}

export default function LoginPage() {
  const router =
    useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [step, setStep] =
    useState<LoginStep>(
      "credentials",
    );

  const [challengeId, setChallengeId] =
    useState("");

  const [verificationCode, setVerificationCode] =
    useState("");

  const [twoFactorMethod, setTwoFactorMethod] =
    useState<TwoFactorMethod>(
      "email",
    );

  const [twoFactorTarget, setTwoFactorTarget] =
    useState("");

  const [challengeMessage, setChallengeMessage] =
    useState("");

  const completeLogin = (
    user: AuthUser,
  ) => {
    localStorage.setItem(
      "auth_user",
      JSON.stringify(user),
    );

    localStorage.setItem(
      "is_authenticated",
      "true",
    );

    window.dispatchEvent(
      new Event(
        "coffer-auth-state-changed",
      ),
    );

    router.replace(
      "/dashboard",
    );

    router.refresh();
  };

  const handleCredentialsSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

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
        "Please enter your email address.",
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const loginUrl =
        `${API_URL}/auth/login`;

      console.log(
        "LOGIN API:",
        loginUrl,
      );

      console.log(
        "LOGIN REQUEST:",
        {
          email:
            normalizedEmail,
          passwordLength:
            password.length,
        },
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
          },
        );

      const data =
        await readJsonResponse<LoginResponse>(
          response,
        );

      console.log(
        "LOGIN STATUS:",
        response.status,
      );

      console.log(
        "LOGIN RESPONSE:",
        data,
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            `Login failed with status ${response.status}.`,
        );
      }

      if (
        isLoginChallenge(data)
      ) {
        setChallengeId(
          data.challengeId,
        );

        setTwoFactorMethod(
          data.method,
        );

        setTwoFactorTarget(
          data.target ?? "",
        );

        setChallengeMessage(
          data.message,
        );

        setVerificationCode("");
        setPassword("");
        setStep("two_factor");

        return;
      }

      if (!isLoginSuccess(data)) {
        throw new Error(
          "User information was not returned by the server.",
        );
      }

      completeLogin(
        data.user,
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error,
      );

      if (
        error instanceof
        TypeError
      ) {
        setErrorMessage(
          "Unable to connect to the server. Please make sure the backend is running.",
        );
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage("");

    const code =
      verificationCode.trim();

    if (!challengeId) {
      setErrorMessage(
        "Your verification request is no longer available. Please sign in again.",
      );
      return;
    }

    if (!code) {
      setErrorMessage(
        "Please enter your verification or backup code.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/auth/verify-2fa`,
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
                challengeId,
                code,
              }),
          },
        );

      const data =
        await readJsonResponse<TwoFactorVerificationResponse>(
          response,
        );

      if (
        !response.ok ||
        !data.success
      ) {
        const attemptsText =
          !data.success &&
          typeof data.attemptsRemaining ===
            "number"
            ? ` ${data.attemptsRemaining} attempt${
                data.attemptsRemaining === 1
                  ? ""
                  : "s"
              } remaining.`
            : "";

        throw new Error(
          `${
            data.message ||
            "Two-factor verification failed."
          }${attemptsText}`,
        );
      }

      if (!isLoginSuccess(data)) {
        throw new Error(
          "User information was not returned after verification.",
        );
      }

      completeLogin(
        data.user,
      );
    } catch (error) {
      console.error(
        "2FA VERIFY ERROR:",
        error,
      );

      if (
        error instanceof
        TypeError
      ) {
        setErrorMessage(
          "Unable to connect to the server. Please make sure the backend is running.",
        );
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const returnToCredentials = () => {
    if (isLoading) {
      return;
    }

    setStep("credentials");
    setChallengeId("");
    setVerificationCode("");
    setTwoFactorTarget("");
    setChallengeMessage("");
    setErrorMessage("");
  };

  return (
    <div className="relative z-10 w-full min-w-0">
      <motion.header
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.48,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
      >
        <motion.div
          whileHover={{
            scale: 1.055,
            rotate: -4,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 19,
          }}
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-indigo-100 text-indigo-700 shadow-[0_12px_30px_rgba(79,70,229,0.13)]"
        >
          {step ===
          "credentials" ? (
            <Fingerprint className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </motion.div>

        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-700">
          {step ===
          "credentials"
            ? "Secure account access"
            : "Two-step verification"}
        </p>

        <h1 className="mt-2 text-[28px] font-black leading-[1.05] tracking-[-0.05em] text-slate-950 min-[380px]:text-[30px] sm:text-[36px]">
          {step ===
          "credentials"
            ? "Welcome back"
            : "Verify your sign-in"}
        </h1>

        <p className="mt-4 max-w-[430px] text-[12px] font-medium leading-6 text-slate-500 sm:text-[13px]">
          {step ===
          "credentials"
            ? "Enter your account credentials to continue to your secure Coffer wallet."
            : `Enter the code sent through ${getMethodLabel(
                twoFactorMethod,
              )}${
                twoFactorTarget
                  ? ` to ${twoFactorTarget}`
                  : ""
              }.`}
        </p>
      </motion.header>

      <AnimatePresence
        initial={false}
      >
        {errorMessage && (
          <motion.div
            role="alert"
            aria-live="polite"
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
              duration: 0.24,
            }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-[10px] font-semibold leading-5 text-rose-700 sm:mt-5 sm:px-4 sm:text-[11px]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {errorMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={
          step ===
          "credentials"
            ? handleCredentialsSubmit
            : handleTwoFactorSubmit
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
        className="mt-6 space-y-4 sm:mt-7 sm:space-y-5"
      >
        {step ===
        "credentials" ? (
          <>
            <div>
          <label
            htmlFor="login-email"
            className="mb-2 block cursor-pointer text-[10px] font-extrabold text-slate-700"
          >
            Email address
          </label>

          <div className="group relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-600" />

            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(
                event,
              ) => {
                setEmail(
                  event.target.value,
                );
              }}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={
                isLoading
              }
              required
              className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-[13px] font-semibold text-slate-900 outline-none transition-all duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
            </div>

            <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <label
              htmlFor="login-password"
              className="cursor-pointer text-[10px] font-extrabold text-slate-700"
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="rounded-md text-[9px] font-extrabold text-violet-700 transition hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Forgot password?
            </Link>
          </div>

          <div className="group relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-600" />

            <input
              id="login-password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(
                event,
              ) => {
                setPassword(
                  event.target.value,
                );
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={
                isLoading
              }
              className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-12 text-[13px] font-semibold text-slate-900 outline-none transition-all duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <motion.button
              type="button"
              disabled={
                isLoading
              }
              whileTap={{
                scale: 0.86,
              }}
              onClick={() => {
                setShowPassword(
                  (current) =>
                    !current,
                );
              }}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700 disabled:pointer-events-none"
            >
              <AnimatePresence
                mode="wait"
                initial={false}
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                <BadgeCheck className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-800">
                  Verification required
                </p>

                <p className="mt-1 text-[9px] font-medium leading-4 text-slate-500">
                  {challengeMessage ||
                    "Enter your verification code to finish signing in."}
                </p>

                <p className="mt-1.5 truncate text-[9px] font-extrabold text-violet-700">
                  {twoFactorTarget ||
                    getMethodLabel(
                      twoFactorMethod,
                    )}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="login-two-factor-code"
                className="mb-2 block cursor-pointer text-[10px] font-extrabold text-slate-700"
              >
                Verification or backup code
              </label>

              <div className="group relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-600" />

                <input
                  id="login-two-factor-code"
                  name="twoFactorCode"
                  type="text"
                  value={
                    verificationCode
                  }
                  onChange={(
                    event,
                  ) => {
                    setVerificationCode(
                      event.target.value,
                    );
                  }}
                  placeholder="Enter the code"
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  maxLength={64}
                  disabled={
                    isLoading
                  }
                  required
                  className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-[15px] font-bold tracking-[0.12em] text-slate-900 outline-none transition-all duration-200 placeholder:text-[13px] placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <p className="mt-2 text-[9px] font-medium leading-4 text-slate-400">
                The code expires shortly. A valid unused backup code also works.
              </p>
            </div>
          </>
        )}

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
                  scale: 0.985,
                }
          }
          className="group relative flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-[13px] font-extrabold text-white shadow-[0_17px_38px_rgba(109,40,217,0.28)] transition-all hover:shadow-[0_20px_44px_rgba(109,40,217,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {!isLoading && (
            <span className="pointer-events-none absolute -left-20 top-0 h-full w-20 -skew-x-12 bg-white/15 transition-transform duration-700 group-hover:translate-x-[620px]" />
          )}

          {isLoading ? (
            <>
              <Loader2 className="relative h-4 w-4 animate-spin" />
              <span className="relative">
                {step ===
                "credentials"
                  ? "Signing in..."
                  : "Verifying..."}
              </span>
            </>
          ) : (
            <>
              <span className="relative">
                {step ===
                "credentials"
                  ? "Sign in securely"
                  : "Verify and continue"}
              </span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </motion.button>

        {step ===
          "two_factor" && (
          <button
            type="button"
            onClick={
              returnToCredentials
            }
            disabled={
              isLoading
            }
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 text-[10px] font-extrabold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to password sign-in
          </button>
        )}
      </motion.form>

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
        {step ===
          "credentials" && (
          <p className="mt-6 text-center text-[10px] font-medium leading-5 text-slate-500 sm:mt-7 sm:text-[11px]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-extrabold text-violet-700 transition hover:text-violet-900"
            >
              Create account
            </Link>
          </p>
        )}

        <div className={`${
          step ===
          "credentials"
            ? "mt-4 sm:mt-5"
            : "mt-5"
        } flex flex-wrap items-center justify-center gap-2 text-center text-[8px] font-semibold text-slate-400 sm:text-[9px]`}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Your account data stays private
        </div>
      </motion.div>
    </div>
  );
}
