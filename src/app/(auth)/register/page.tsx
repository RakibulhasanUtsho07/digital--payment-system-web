"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ElementType,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  WalletCards,
  Zap,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

import {
  saveAuth,
  type AuthUser,
} from "@/lib/auth/auth";

/* =========================================================
   TYPES
========================================================= */

interface RegisterResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  token: string;
}

/* =========================================================
   FEATURES
========================================================= */

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Protected payment flows with validation and authentication.",
  },
  {
    icon: Fingerprint,
    title: "KYC Verification",
    description:
      "Identity verification designed for secure onboarding.",
  },
  {
    icon: Zap,
    title: "Smart Intelligence",
    description:
      "AI-assisted spending and financial insights.",
  },
];

/* =========================================================
   REGISTER PAGE
========================================================= */

export default function RegisterPage() {
  const router = useRouter();

  /* ---------------------------------------------------------
     FORM STATE
  --------------------------------------------------------- */

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ---------------------------------------------------------
     UI STATE
  --------------------------------------------------------- */

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const handleImageUpload = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Image size must be less than 5MB."
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setProfileImage(previewUrl);
    setErrorMessage("");
  };

  /* =========================================================
     REGISTER
  ========================================================= */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    const fullName =
      `${trimmedFirstName} ${trimmedLastName}`.trim();

    /* ---------------------------------------------------------
       VALIDATION
    --------------------------------------------------------- */

    if (!trimmedFirstName || !trimmedLastName) {
      setErrorMessage(
        "Please enter your first and last name."
      );
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage(
        "Please enter your phone number."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }

    /* ---------------------------------------------------------
       START REQUEST
    --------------------------------------------------------- */

    setIsLoading(true);

    try {
      const data =
        await apiClient<RegisterResponse>(
          "/auth/register",
          {
            method: "POST",

            body: JSON.stringify({
              name: fullName,
              email: trimmedEmail,
              phone: trimmedPhone,
              password,
            }),
          }
        );

      /* -------------------------------------------------------
         SAVE AUTH DATA
      ------------------------------------------------------- */

      saveAuth(data.token, data.user);

      /* -------------------------------------------------------
         REDIRECT
      ------------------------------------------------------- */

      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="grid min-h-[760px] w-full grid-cols-1 lg:grid-cols-12">

      {/* =====================================================
          LEFT BRANDING PANEL
      ====================================================== */}

      <section className="relative hidden overflow-hidden rounded-l-[2rem] bg-[#020617] lg:col-span-7 lg:flex">

        {/* Grid background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Blue glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]"
        />

        {/* Cyan glow */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.28, 0.12],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-20 -right-20 h-[360px] w-[360px] rounded-full bg-cyan-500/20 blur-[110px]"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">

          {/* --------------------------------------------------
              BRAND
          --------------------------------------------------- */}

          <Link
            href="/"
            className="flex w-fit items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-white/10 text-cyan-300 shadow-lg">
              <WalletCards className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xl font-black text-white">
                Nova
                <span className="text-cyan-400">
                  Wallet
                </span>
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/60">
                Digital Wallet System
              </p>
            </div>
          </Link>

          {/* --------------------------------------------------
              HERO CONTENT
          --------------------------------------------------- */}

          <div className="my-auto py-10">
            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
              }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />

                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  Join the platform
                </span>
              </div>

              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-white xl:text-5xl">
                Build a smarter
                <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  financial future.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">
                Create your secure digital wallet and get access
                to transfers, KYC verification, transaction tracking,
                secure payments and intelligent financial assistance.
              </p>
            </motion.div>

            {/* ------------------------------------------------
                FEATURE CARDS
            ------------------------------------------------- */}

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.div
                    key={feature.title}
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.15 + index * 0.08,
                      duration: 0.45,
                    }}
                    whileHover={{
                      y: -4,
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md"
                  >
                    <Icon className="h-5 w-5 text-cyan-400" />

                    <p className="mt-3 text-xs font-semibold text-white">
                      {feature.title}
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-slate-400">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* --------------------------------------------------
              SECURITY FOOTER
          --------------------------------------------------- */}

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <Shield className="h-4 w-4 text-cyan-400" />

            <span>
              Secure onboarding • Private account access
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          REGISTER FORM PANEL
      ====================================================== */}

      <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:col-span-5 lg:px-12 xl:px-14">

        <div className="w-full max-w-[450px]">

          {/* --------------------------------------------------
              HEADER
          --------------------------------------------------- */}

          <motion.div
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
            }}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <Fingerprint className="h-6 w-6" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Create Account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Set up your secure wallet account.
            </p>
          </motion.div>

          {/* --------------------------------------------------
              ERROR MESSAGE
          --------------------------------------------------- */}

          {errorMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* --------------------------------------------------
              REGISTER FORM
          --------------------------------------------------- */}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >

            {/* PROFILE IMAGE */}

            <div className="flex justify-center pb-1">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="group relative flex h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-cyan-500 hover:bg-cyan-50/50"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Camera className="h-6 w-6 text-slate-400 transition group-hover:scale-110 group-hover:text-cyan-600" />
                  </span>
                )}

                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* FIRST + LAST NAME */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="First Name"
                value={firstName}
                onChange={setFirstName}
                placeholder="John"
                icon={User}
              />

              <InputField
                label="Last Name"
                value={lastName}
                onChange={setLastName}
                placeholder="Doe"
                icon={User}
              />
            </div>

            {/* PHONE */}

            <InputField
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="+880 1XXX-XXXXXX"
              icon={Phone}
              type="tel"
            />

            {/* EMAIL */}

            <InputField
              label="Email Address"
              value={email}
              onChange={setEmail}
              placeholder="name@domain.com"
              icon={Mail}
              type="email"
            />

            {/* PASSWORD */}

            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a secure password"
              visible={showPassword}
              onToggle={() =>
                setShowPassword((value) => !value)
              }
            />

            {/* CONFIRM PASSWORD */}

            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
            />

            {/* TERMS */}

            <label className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
              />

              <span className="text-[10px] leading-5 text-slate-500">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {/* ------------------------------------------------
                SUBMIT BUTTON
            ------------------------------------------------- */}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] text-sm font-bold text-white shadow-lg transition-all hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Create Wallet
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* --------------------------------------------------
              LOGIN LINK
          --------------------------------------------------- */}

          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>

          {/* SECURITY */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

            <span>
              Secure digital wallet onboarding
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   NORMAL INPUT
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ElementType;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
    </div>
  );
}

/* =========================================================
   PASSWORD INPUT
========================================================= */

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}