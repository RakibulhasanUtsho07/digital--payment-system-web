"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  ImagePlus,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

/* =========================================================
   TYPES
========================================================= */

type RegisterStep =
  | "register"
  | "verify";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  kycStatus:
    | "not_started"
    | "pending"
    | "under_review"
    | "verified"
    | "rejected";
  avatarUrl?: string;
  emailVerified?: boolean;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  code?: string;
  field?: string;
  user?: AuthUser;
  requiresEmailVerification?: boolean;
  email?: string;
}

interface SimpleApiResponse {
  success: boolean;
  message: string;
  code?: string;
}

/* =========================================================
   PAGE
========================================================= */

export default function RegisterPage() {
  const router =
    useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /* =======================================================
     REGISTRATION STATE
  ======================================================== */

  const [step, setStep] =
    useState<RegisterStep>(
      "register"
    );

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    profileImage,
    setProfileImage,
  ] = useState<string | null>(
    null
  );

  const [
    profileImageFile,
    setProfileImageFile,
  ] = useState<File | null>(
    null
  );

  const [
    imageName,
    setImageName,
  ] = useState("");

  const [
    termsAccepted,
    setTermsAccepted,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     OTP STATE
  ======================================================== */

  const [
    registeredEmail,
    setRegisteredEmail,
  ] = useState("");

  const [otp, setOtp] =
    useState("");

  const [
    otpError,
    setOtpError,
  ] = useState("");

  const [
    isVerifying,
    setIsVerifying,
  ] = useState(false);

  const [
    isResending,
    setIsResending,
  ] = useState(false);

  const [
    resendMessage,
    setResendMessage,
  ] = useState("");

  const [
    resendCooldown,
    setResendCooldown,
  ] = useState(0);

  /* =======================================================
     PREVIEW URL CLEANUP
  ======================================================== */

  useEffect(() => {
    return () => {
      if (profileImage) {
        URL.revokeObjectURL(
          profileImage
        );
      }
    };
  }, [profileImage]);

  /* =======================================================
     OTP COUNTDOWN
  ======================================================== */

  useEffect(() => {
    if (
      resendCooldown <= 0
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setResendCooldown(
          (current) =>
            Math.max(
              current - 1,
              0
            )
        );
      }, 1000);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [resendCooldown]);

  /* =======================================================
     IMAGE UPLOAD
  ======================================================== */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setErrorMessage(
        "Please select a JPG, PNG, or WEBP image."
      );

      event.target.value = "";
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      setErrorMessage(
        "Profile image must be smaller than 5MB."
      );

      event.target.value = "";
      return;
    }

    if (profileImage) {
      URL.revokeObjectURL(
        profileImage
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setProfileImage(
      previewUrl
    );

    setProfileImageFile(
      file
    );

    setImageName(
      file.name
    );
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================== */

  const handleRemoveImage =
    () => {
      if (profileImage) {
        URL.revokeObjectURL(
          profileImage
        );
      }

      setProfileImage(
        null
      );

      setProfileImageFile(
        null
      );

      setImageName("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* =======================================================
     PHONE
  ======================================================== */

  const handlePhoneChange =
    (
      value: string
    ) => {
      const cleaned =
        value.replace(
          /[^\d+\-\s]/g,
          ""
        );

      setPhone(cleaned);
    };

  /* =======================================================
     REGISTER
  ======================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage("");

    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanPhone =
      phone.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const cleanPassword =
      password;

    const fullName =
      `${cleanFirstName} ${cleanLastName}`.trim();

    /* =====================================================
       VALIDATION
    ====================================================== */

    if (!cleanFirstName) {
      setErrorMessage(
        "Please enter your first name."
      );
      return;
    }

    if (!cleanLastName) {
      setErrorMessage(
        "Please enter your last name."
      );
      return;
    }

    if (!cleanPhone) {
      setErrorMessage(
        "Please enter your phone number."
      );
      return;
    }

    if (!cleanEmail) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        cleanEmail
      )
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      cleanPassword.length < 6
    ) {
      setErrorMessage(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      cleanPassword !==
      confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }

    if (
      !profileImageFile
    ) {
      setErrorMessage(
        "Please upload a profile photo."
      );

      fileInputRef.current?.click();

      return;
    }

    if (!termsAccepted) {
      setErrorMessage(
        "Please accept the Terms and Privacy Policy."
      );

      return;
    }

    /* =====================================================
       REQUEST
    ====================================================== */

    setIsLoading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "name",
        fullName
      );

      formData.append(
        "email",
        cleanEmail
      );

      formData.append(
        "phone",
        cleanPhone
      );

      formData.append(
        "password",
        cleanPassword
      );

      formData.append(
        "profileImage",
        profileImageFile
      );

      const response =
        await fetch(
          `${API_BASE}/auth/register`,
          {
            method: "POST",

            body: formData,

            credentials:
              "include",
          }
        );

      const data =
        (await response
          .json()
          .catch(
            () => null
          )) as
          | RegisterResponse
          | null;

      /* ===================================================
         409
      ==================================================== */

      if (
        response.status ===
        409
      ) {
        throw new Error(
          data?.message ||
            "An account with this email or phone already exists."
        );
      }

      /* ===================================================
         OTHER HTTP ERROR
      ==================================================== */

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Registration failed with status ${response.status}.`
        );
      }

      if (
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Registration failed."
        );
      }

      /* ===================================================
         SUCCESS
      ==================================================== */

      const verificationEmail =
        data.email ||
        cleanEmail;

      setRegisteredEmail(
        verificationEmail
      );

      setOtp("");

      setOtpError("");

      setResendMessage(
        data.message ||
          "We just emailed you a 6-digit verification code."
      );

      setResendCooldown(
        RESEND_COOLDOWN_SECONDS
      );

      setStep(
        "verify"
      );
    } catch (error) {
      console.error(
        "REGISTER CLIENT ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     VERIFY OTP
  ======================================================== */

  const handleVerifyOtp =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (isVerifying) {
        return;
      }

      setOtpError("");

      const cleanOtp =
        otp
          .replace(/\D/g, "")
          .slice(
            0,
            OTP_LENGTH
          );

      if (
        cleanOtp.length !==
        OTP_LENGTH
      ) {
        setOtpError(
          `Please enter the ${OTP_LENGTH}-digit verification code.`
        );

        return;
      }

      if (!registeredEmail) {
        setOtpError(
          "Registration email is missing. Please register again."
        );

        return;
      }

      setIsVerifying(true);

      try {
        const response =
          await fetch(
            `${API_BASE}/auth/verify-otp`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  email:
                    registeredEmail,

                  otp:
                    cleanOtp,
                }),
            }
          );

        const data =
          (await response
            .json()
            .catch(
              () => null
            )) as
            | RegisterResponse
            | null;

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Verification failed with status ${response.status}.`
          );
        }

        if (
          !data?.success ||
          !data.user
        ) {
          throw new Error(
            data?.message ||
              "Verification failed."
          );
        }

        /* =================================================
           SESSION IS CREATED BY BACKEND

           issueAuthenticatedSession()
           should set the HttpOnly cookie.
        ================================================== */

        try {
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
        } catch (
          storageError
        ) {
          console.warn(
            "LOCAL STORAGE ERROR:",
            storageError
          );
        }

        router.replace(
          "/dashboard"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "VERIFY OTP CLIENT ERROR:",
          error
        );

        setOtpError(
          error instanceof Error
            ? error.message
            : "Verification failed. Please try again."
        );
      } finally {
        setIsVerifying(
          false
        );
      }
    };

  /* =======================================================
     RESEND OTP
  ======================================================== */

  const handleResendOtp =
    async () => {
      if (
        isResending ||
        resendCooldown > 0
      ) {
        return;
      }

      if (!registeredEmail) {
        setOtpError(
          "Registration email is missing. Please register again."
        );

        return;
      }

      setOtpError("");
      setResendMessage("");
      setIsResending(true);

      try {
        const response =
          await fetch(
            `${API_BASE}/auth/resend-otp`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  email:
                    registeredEmail,
                }),
            }
          );

        const data =
          (await response
            .json()
            .catch(
              () => null
            )) as
            | SimpleApiResponse
            | null;

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to resend code. Status ${response.status}.`
          );
        }

        if (
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to resend code."
          );
        }

        setResendMessage(
          data.message ||
            "A new verification code has been sent."
        );

        setResendCooldown(
          RESEND_COOLDOWN_SECONDS
        );
      } catch (error) {
        console.error(
          "RESEND OTP CLIENT ERROR:",
          error
        );

        setOtpError(
          error instanceof Error
            ? error.message
            : "Could not resend the code."
        );
      } finally {
        setIsResending(
          false
        );
      }
    };

  /* =======================================================
     RETURN
  ======================================================== */

  return (
    <div className="relative z-10 w-full pointer-events-auto">
      <AnimatePresence mode="wait">

        {/* =================================================
            REGISTER
        ================================================== */}

        {step === "register" ? (
          <motion.div
            key="register"
            initial={{
              opacity: 0,
              x: -18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 18,
            }}
            transition={{
              duration: 0.38,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >

            {/* HEADER */}

            <div>
              <motion.div
                whileHover={{
                  scale: 1.05,
                  rotate: -3,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="
                  mb-3
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-[13px]
                  border
                  border-[#D9E8F6]
                  bg-[#EEF6FF]
                  text-[#1F5EA8]
                  shadow-[0_8px_20px_rgba(31,94,168,0.08)]
                "
              >
                <Fingerprint className="h-[18px] w-[18px]" />
              </motion.div>

              <p className="
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.18em]
                text-[#1F5EA8]
              ">
                Secure onboarding
              </p>

              <h1 className="
                mt-1.5
                text-[28px]
                font-black
                tracking-[-0.045em]
                text-[#102A43]
                sm:text-[30px]
              ">
                Create account
              </h1>

              <p className="
                mt-1
                max-w-md
                text-[11px]
                font-medium
                leading-5
                text-[#718296]
                sm:text-[12px]
              ">
                Create your secure digital wallet and
                start managing your payments with confidence.
              </p>
            </div>

            {/* ERROR */}

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="overflow-hidden"
                >
                  <div className="
                    mt-3.5
                    flex
                    items-start
                    gap-2.5
                    rounded-[13px]
                    border
                    border-rose-200
                    bg-rose-50
                    px-3
                    py-2.5
                    text-[11px]
                    font-semibold
                    text-rose-600
                  ">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                    <span>
                      {errorMessage}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORM */}

            <motion.form
              onSubmit={
                handleSubmit
              }
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.05,
                duration: 0.4,
              }}
              className="mt-4 space-y-3"
            >

              {/* PROFILE IMAGE */}

              <div className="
                rounded-[18px]
                border
                border-[#E1EAF2]
                bg-gradient-to-r
                from-[#F8FBFD]
                to-[#F4F9FC]
                p-2.5
              ">
                <div className="flex items-center gap-3">

                  <div className="relative">
                    <input
                      ref={
                        fileInputRef
                      }
                      id="register-profile-image"
                      name="profileImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleImageUpload
                      }
                      className="sr-only"
                    />

                    <label
                      htmlFor="register-profile-image"
                      className="
                        group
                        relative
                        flex
                        h-[62px]
                        w-[62px]
                        cursor-pointer
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-[17px]
                        border
                        border-dashed
                        border-[#BCD0E0]
                        bg-white
                        transition-all
                        duration-300
                        hover:border-[#4D95D5]
                        hover:bg-[#F1F8FE]
                        hover:shadow-[0_8px_20px_rgba(31,94,168,0.08)]
                      "
                    >
                      {profileImage ? (
                        <>
                          <img
                            src={
                              profileImage
                            }
                            alt="Profile preview"
                            className="
                              h-full
                              w-full
                              object-cover
                            "
                          />

                          <span className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-[#102A43]/45
                            opacity-0
                            transition-opacity
                            duration-300
                            group-hover:opacity-100
                          ">
                            <Camera className="h-4 w-4 text-white" />
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImagePlus className="
                            h-5
                            w-5
                            text-[#7893A8]
                            transition
                            group-hover:text-[#1F5EA8]
                          " />

                          <span className="
                            text-[7px]
                            font-extrabold
                            uppercase
                            tracking-wider
                            text-[#8FA0AF]
                          ">
                            Upload
                          </span>
                        </div>
                      )}
                    </label>

                    {profileImage && (
                      <motion.button
                        type="button"
                        whileTap={{
                          scale: 0.85,
                        }}
                        onClick={
                          handleRemoveImage
                        }
                        className="
                          absolute
                          -right-1
                          -top-1
                          z-20
                          flex
                          h-5
                          w-5
                          items-center
                          justify-center
                          rounded-full
                          border-2
                          border-white
                          bg-[#173D68]
                          text-white
                          shadow-sm
                        "
                        aria-label="Remove profile image"
                      >
                        <X className="h-2.5 w-2.5" />
                      </motion.button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="register-profile-image"
                      className="
                        cursor-pointer
                        text-[11px]
                        font-extrabold
                        text-[#304A62]
                      "
                    >
                      Profile photo
                    </label>

                    <p className="
                      mt-0.5
                      truncate
                      text-[9px]
                      leading-4
                      text-[#8B9AAB]
                    ">
                      {imageName ||
                        "Required • JPG, PNG or WEBP • Max 5MB"}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="
                        h-3
                        w-3
                        text-[#2DBE8C]
                      " />

                      <span className="
                        text-[8px]
                        font-semibold
                        text-[#7B8D9F]
                      ">
                        Securely uploaded to your account
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NAMES */}

              <div className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
              ">
                <InputField
                  id="register-first-name"
                  name="firstName"
                  label="First Name"
                  value={
                    firstName
                  }
                  onChange={
                    setFirstName
                  }
                  placeholder="First name"
                  icon={User}
                  autoComplete="given-name"
                  disabled={
                    isLoading
                  }
                />

                <InputField
                  id="register-last-name"
                  name="lastName"
                  label="Last Name"
                  value={
                    lastName
                  }
                  onChange={
                    setLastName
                  }
                  placeholder="Last name"
                  icon={User}
                  autoComplete="family-name"
                  disabled={
                    isLoading
                  }
                />
              </div>

              {/* PHONE + EMAIL */}

              <div className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
              ">
                <InputField
                  id="register-phone"
                  name="phone"
                  label="Phone Number"
                  value={
                    phone
                  }
                  onChange={
                    handlePhoneChange
                  }
                  placeholder="+880 1XXX..."
                  icon={Phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={
                    isLoading
                  }
                />

                <InputField
                  id="register-email"
                  name="email"
                  label="Email Address"
                  value={
                    email
                  }
                  onChange={
                    setEmail
                  }
                  placeholder="name@example.com"
                  icon={Mail}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  disabled={
                    isLoading
                  }
                />
              </div>

              {/* PASSWORD */}

              <div className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
              ">
                <PasswordField
                  id="register-password"
                  name="password"
                  label="Password"
                  value={
                    password
                  }
                  onChange={
                    setPassword
                  }
                  visible={
                    showPassword
                  }
                  onToggle={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  autoComplete="new-password"
                  disabled={
                    isLoading
                  }
                />

                <PasswordField
                  id="register-confirm-password"
                  name="confirmPassword"
                  label="Confirm Password"
                  value={
                    confirmPassword
                  }
                  onChange={
                    setConfirmPassword
                  }
                  visible={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  autoComplete="new-password"
                  disabled={
                    isLoading
                  }
                />
              </div>

              {/* TERMS */}

              <label className="
                flex
                cursor-pointer
                items-start
                gap-2.5
                px-1
                pt-1
              ">
                <input
                  type="checkbox"
                  checked={
                    termsAccepted
                  }
                  onChange={(
                    event
                  ) =>
                    setTermsAccepted(
                      event.target.checked
                    )
                  }
                  disabled={
                    isLoading
                  }
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    cursor-pointer
                    accent-[#1F5EA8]
                  "
                />

                <span className="
                  text-[9px]
                  font-medium
                  leading-5
                  text-[#6E7E90]
                ">
                  I agree to the{" "}

                  <Link
                    href="/terms"
                    className="font-extrabold text-[#1F5EA8]"
                  >
                    Terms
                  </Link>{" "}

                  and{" "}

                  <Link
                    href="/privacy"
                    className="font-extrabold text-[#1F5EA8]"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {/* SUBMIT */}

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
                className="
                  group
                  relative
                  flex
                  h-[48px]
                  w-full
                  items-center
                  justify-center
                  gap-2
                  overflow-hidden
                  rounded-[14px]
                  bg-gradient-to-r
                  from-[#174F82]
                  via-[#1F5EA8]
                  to-[#287EC5]
                  text-xs
                  font-extrabold
                  text-white
                  shadow-[0_12px_27px_rgba(31,94,168,0.22)]
                  transition-all
                  hover:shadow-[0_17px_34px_rgba(31,94,168,0.28)]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {!isLoading && (
                  <span className="
                    pointer-events-none
                    absolute
                    -left-16
                    top-0
                    h-full
                    w-16
                    -skew-x-12
                    bg-white/10
                    transition-transform
                    duration-700
                    group-hover:translate-x-[600px]
                  " />
                )}

                {isLoading ? (
                  <>
                    <Loader2 className="relative h-4 w-4 animate-spin" />

                    <span className="relative">
                      Creating account...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative">
                      Create Wallet
                    </span>

                    <ArrowRight className="
                      relative
                      h-4
                      w-4
                      transition-transform
                      group-hover:translate-x-1
                    " />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* LOGIN */}

            <p className="
              mt-4
              text-center
              text-[10px]
              font-medium
              text-[#778799]
            ">
              Already have an account?{" "}

              <Link
                href="/login"
                className="
                  font-extrabold
                  text-[#1F5EA8]
                  transition
                  hover:text-[#17466F]
                "
              >
                Sign in
              </Link>
            </p>

            <div className="
              mt-3
              flex
              items-center
              justify-center
              gap-2
              text-[9px]
              font-semibold
              text-[#9AA7B5]
            ">
              <ShieldCheck className="
                h-3.5
                w-3.5
                text-emerald-600
              " />

              Secure digital wallet onboarding
            </div>
          </motion.div>
        ) : (

          /* =================================================
             VERIFY
          ================================================== */

          <motion.div
            key="verify"
            initial={{
              opacity: 0,
              x: 18,
              scale: 0.99,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: -18,
              scale: 0.99,
            }}
            transition={{
              duration: 0.42,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >
            {/* VERIFY HEADER */}

            <div>
              <motion.div
                animate={{
                  y: [
                    0,
                    -3,
                    0,
                  ],
                }}
                transition={{
                  duration: 3.2,
                  repeat:
                    Infinity,
                  ease: "easeInOut",
                }}
                className="
                  mb-3
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-[13px]
                  border
                  border-[#D9E8F6]
                  bg-[#EEF6FF]
                  text-[#1F5EA8]
                  shadow-[0_8px_20px_rgba(31,94,168,0.08)]
                "
              >
                <Mail className="h-[18px] w-[18px]" />
              </motion.div>

              <p className="
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.18em]
                text-[#1F5EA8]
              ">
                Secure verification
              </p>

              <h1 className="
                mt-1.5
                text-[28px]
                font-black
                tracking-[-0.045em]
                text-[#102A43]
                sm:text-[30px]
              ">
                Verify your email
              </h1>

              <p className="
                mt-1
                text-[11px]
                font-medium
                leading-5
                text-[#718296]
                sm:text-[12px]
              ">
                We sent a 6-digit verification code to{" "}

                <span className="font-extrabold text-[#344A60]">
                  {registeredEmail}
                </span>
              </p>
            </div>

            {/* OTP ERROR */}

            <AnimatePresence>
              {otpError && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="overflow-hidden"
                >
                  <div className="
                    mt-3.5
                    flex
                    items-start
                    gap-2.5
                    rounded-[13px]
                    border
                    border-rose-200
                    bg-rose-50
                    px-3
                    py-2.5
                    text-[11px]
                    font-semibold
                    text-rose-600
                  ">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                    <span>
                      {otpError}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OTP FORM */}

            <motion.form
              onSubmit={
                handleVerifyOtp
              }
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.05,
                duration: 0.4,
              }}
              className="mt-5"
            >
              <div className="
                rounded-[22px]
                border
                border-[#E0E9F0]
                bg-gradient-to-b
                from-[#FBFDFF]
                to-[#F5F9FC]
                p-4
                shadow-[0_10px_35px_rgba(23,61,104,0.05)]
              ">

                {/* SECURE INDICATOR */}

                <div className="
                  flex
                  items-center
                  justify-between
                ">
                  <div className="
                    flex
                    items-center
                    gap-2
                  ">
                    <div className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#EAF3FC]
                      text-[#1F5EA8]
                    ">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="
                        text-[10px]
                        font-extrabold
                        text-[#304A62]
                      ">
                        Email verification
                      </p>

                      <p className="
                        mt-0.5
                        text-[8px]
                        font-medium
                        text-[#8A98A8]
                      ">
                        Enter the code from your inbox
                      </p>
                    </div>
                  </div>

                  <span className="
                    rounded-full
                    bg-[#EEF8F3]
                    px-2
                    py-1
                    text-[8px]
                    font-bold
                    text-[#238B67]
                  ">
                    Secure
                  </span>
                </div>

                {/* OTP INPUT */}

                <div className="mt-5">
                  <OtpInput
                    value={
                      otp
                    }
                    onChange={
                      setOtp
                    }
                    disabled={
                      isVerifying
                    }
                  />
                </div>

                {/* RESEND MESSAGE */}

                {resendMessage && (
                  <motion.p
                    initial={{
                      opacity: 0,
                      y: 4,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="
                      mt-3
                      text-center
                      text-[10px]
                      font-semibold
                      text-emerald-600
                    "
                  >
                    {resendMessage}
                  </motion.p>
                )}

                {/* VERIFY BUTTON */}

                <motion.button
                  type="submit"
                  disabled={
                    isVerifying ||
                    otp.length !==
                      OTP_LENGTH
                  }
                  whileHover={
                    isVerifying
                      ? undefined
                      : {
                          y: -2,
                        }
                  }
                  whileTap={{
                    scale: 0.985,
                  }}
                  className="
                    group
                    mt-4
                    flex
                    h-[48px]
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-[14px]
                    bg-gradient-to-r
                    from-[#174F82]
                    via-[#1F5EA8]
                    to-[#287EC5]
                    text-xs
                    font-extrabold
                    text-white
                    shadow-[0_12px_27px_rgba(31,94,168,0.20)]
                    transition-all
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue

                      <ArrowRight className="
                        h-4
                        w-4
                        transition-transform
                        group-hover:translate-x-1
                      " />
                    </>
                  )}
                </motion.button>

                {/* RESEND */}

                <div className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  justify-center
                  gap-1.5
                  text-[10px]
                  font-medium
                  text-[#718296]
                ">
                  Didn&apos;t receive the code?

                  <button
                    type="button"
                    onClick={
                      handleResendOtp
                    }
                    disabled={
                      isResending ||
                      resendCooldown >
                        0
                    }
                    className="
                      font-extrabold
                      text-[#1F5EA8]
                      transition
                      hover:text-[#17466F]
                      disabled:cursor-not-allowed
                      disabled:text-[#9AA7B5]
                    "
                  >
                    {resendCooldown >
                    0
                      ? `Resend in ${resendCooldown}s`
                      : isResending
                        ? "Sending..."
                        : "Resend code"}
                  </button>
                </div>
              </div>

              {/* BACK */}

              <button
                type="button"
                onClick={() => {
                  setStep(
                    "register"
                  );

                  setOtp("");

                  setOtpError("");

                  setResendMessage("");
                }}
                className="
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-1.5
                  text-center
                  text-[10px]
                  font-semibold
                  text-[#9AA7B5]
                  transition
                  hover:text-[#1F5EA8]
                "
              >
                <ArrowLeft className="h-3 w-3" />

                Back to registration
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   OTP INPUT
========================================================= */

function OtpInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  disabled?: boolean;
}) {
  const inputRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  const chars =
    Array.from(
      {
        length:
          OTP_LENGTH,
      },
      (_, index) =>
        value[index] || ""
    );

  const updateChars = (
    nextChars: string[]
  ) => {
    onChange(
      nextChars
        .join("")
        .replace(/\D/g, "")
        .slice(
          0,
          OTP_LENGTH
        )
    );
  };

  const handleChange = (
    index: number,
    rawValue: string
  ) => {
    const digits =
      rawValue.replace(
        /\D/g,
        ""
      );

    if (!digits) {
      const next =
        chars.slice();

      next[index] = "";

      updateChars(next);

      return;
    }

    const firstEmptyIndex =
      chars.findIndex(
        (character) =>
          !character
      );

    const targetIndex =
      firstEmptyIndex === -1 ||
      firstEmptyIndex >= index
        ? index
        : firstEmptyIndex;

    const next =
      chars.slice();

    next[targetIndex] =
      digits[digits.length - 1];

    updateChars(next);

    if (
      targetIndex <
      OTP_LENGTH - 1
    ) {
      inputRefs.current[
        targetIndex + 1
      ]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key ===
        "Backspace" &&
      !chars[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowLeft" &&
      index > 0
    ) {
      event.preventDefault();

      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key ===
        "ArrowRight" &&
      index <
        OTP_LENGTH - 1
    ) {
      event.preventDefault();

      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  const handlePaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>
  ) => {
    const pasted =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(
          0,
          OTP_LENGTH
        );

    if (!pasted) {
      return;
    }

    event.preventDefault();

    const next =
      chars.slice();

    pasted
      .split("")
      .forEach(
        (
          character,
          offset
        ) => {
          const targetIndex =
            index +
            offset;

          if (
            targetIndex <
            OTP_LENGTH
          ) {
            next[targetIndex] =
              character;
          }
        }
      );

    updateChars(next);

    const targetIndex =
      Math.min(
        index +
          pasted.length,
        OTP_LENGTH - 1
      );

    inputRefs.current[
      targetIndex
    ]?.focus();
  };

  return (
    <div className="
      flex
      items-center
      justify-center
      gap-2
      sm:gap-2.5
    ">
      {chars.map(
        (
          char,
          index
        ) => (
          <motion.input
            key={index}
            ref={(element) => {
              inputRefs.current[
                index
              ] = element;
            }}
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay:
                index *
                0.035,
            }}
            type="text"
            inputMode="numeric"
            autoComplete={
              index === 0
                ? "one-time-code"
                : "off"
            }
            maxLength={1}
            value={char}
            disabled={
              disabled
            }
            onChange={(
              event
            ) =>
              handleChange(
                index,
                event.target
                  .value
              )
            }
            onKeyDown={(
              event
            ) =>
              handleKeyDown(
                index,
                event
              )
            }
            onPaste={(
              event
            ) =>
              handlePaste(
                index,
                event
              )
            }
            whileFocus={{
              scale: 1.03,
            }}
            className="
              h-[52px]
              w-[43px]
              rounded-[13px]
              border
              border-[#D5E1EA]
              bg-white
              text-center
              text-[18px]
              font-black
              text-[#18334B]
              outline-none
              shadow-[0_5px_15px_rgba(23,61,104,0.03)]
              transition-all
              duration-200
              hover:border-[#BFD2E2]
              focus:border-[#3E8FD9]
              focus:shadow-[0_8px_20px_rgba(31,94,168,0.09)]
              focus:ring-4
              focus:ring-[#1F5EA8]/[0.07]
              disabled:cursor-not-allowed
              disabled:opacity-60
              sm:h-[56px]
              sm:w-[48px]
            "
          />
        )
      )}
    </div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  inputMode,
  autoComplete,
  disabled = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  icon: LucideIcon;
  type?: string;
  inputMode?:
    | "text"
    | "email"
    | "tel"
    | "numeric"
    | "decimal"
    | "search"
    | "url"
    | "none";
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="
          mb-1.5
          block
          cursor-pointer
          text-[9px]
          font-extrabold
          text-[#344A60]
        "
      >
        {label}
      </label>

      <div className="group relative">
        <Icon className="
          pointer-events-none
          absolute
          left-3.5
          top-1/2
          z-10
          h-3.5
          w-3.5
          -translate-y-1/2
          text-[#91A0B1]
          transition-colors
          group-focus-within:text-[#1F5EA8]
        " />

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          inputMode={
            inputMode
          }
          autoComplete={
            autoComplete
          }
          required
          disabled={
            disabled
          }
          className="
            h-[44px]
            w-full
            rounded-[12px]
            border
            border-[#DBE5EE]
            bg-[#F8FAFC]
            pl-10
            pr-3
            text-[11px]
            font-semibold
            text-[#18334B]
            outline-none
            transition-all
            placeholder:font-medium
            placeholder:text-[#9EABBA]
            hover:border-[#CBD9E7]
            focus:border-[#3E8FD9]
            focus:bg-white
            focus:ring-4
            focus:ring-[#1F5EA8]/[0.07]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        />
      </div>
    </div>
  );
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  disabled = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="
          mb-1.5
          block
          cursor-pointer
          text-[9px]
          font-extrabold
          text-[#344A60]
        "
      >
        {label}
      </label>

      <div className="group relative">
        <KeyRound className="
          pointer-events-none
          absolute
          left-3.5
          top-1/2
          z-10
          h-3.5
          w-3.5
          -translate-y-1/2
          text-[#91A0B1]
          transition-colors
          group-focus-within:text-[#1F5EA8]
        " />

        <input
          id={id}
          name={name}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          placeholder="••••••••"
          autoComplete={
            autoComplete
          }
          required
          disabled={
            disabled
          }
          className="
            h-[44px]
            w-full
            rounded-[12px]
            border
            border-[#DBE5EE]
            bg-[#F8FAFC]
            pl-10
            pr-10
            text-[11px]
            font-semibold
            text-[#18334B]
            outline-none
            transition-all
            placeholder:text-[#A0ACB9]
            hover:border-[#CBD9E7]
            focus:border-[#3E8FD9]
            focus:bg-white
            focus:ring-4
            focus:ring-[#1F5EA8]/[0.07]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        />

        <motion.button
          type="button"
          disabled={
            disabled
          }
          whileTap={{
            scale: 0.86,
          }}
          onClick={
            onToggle
          }
          aria-label={
            visible
              ? `Hide ${label}`
              : `Show ${label}`
          }
          className="
            absolute
            right-2.5
            top-1/2
            z-20
            flex
            h-7
            w-7
            -translate-y-1/2
            items-center
            justify-center
            rounded-lg
            text-[#91A0B1]
            transition-all
            hover:bg-[#EEF5FC]
            hover:text-[#1F5EA8]
            disabled:pointer-events-none
          "
        >
          {visible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </motion.button>
      </div>
    </div>
  );
}