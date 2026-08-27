"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
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
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;

  role: "user" | "admin";

  kycStatus:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

/* =========================================================
   PAGE
========================================================= */

export default function RegisterPage() {
  const router = useRouter();

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

  /* =========================================================
     CLEAN OBJECT URL
  ========================================================== */

  useEffect(() => {
    return () => {
      if (profileImage) {
        URL.revokeObjectURL(
          profileImage
        );
      }
    };
  }, [profileImage]);

  /* =========================================================
     IMAGE
  ========================================================== */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setErrorMessage(
        "Please select a valid image."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setErrorMessage(
        "Image size must be below 5MB."
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

    setImageName(
      file.name
    );
  };

  /* =========================================================
     PHONE
  ========================================================== */

  const handlePhoneChange = (
    value: string
  ) => {
    /*
     * Allows numbers, spaces,
     * + and - only.
     */

    const cleaned =
      value.replace(
        /[^0-9+\-\s]/g,
        ""
      );

    setPhone(cleaned);
  };

  /* =========================================================
     SUBMIT
  ========================================================== */

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

    const fullName =
      `${cleanFirstName} ${cleanLastName}`.trim();

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

    if (
      password.length < 6
    ) {
      setErrorMessage(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    if (!termsAccepted) {
      setErrorMessage(
        "Please accept the Terms and Privacy Policy."
      );

      return;
    }

    setIsLoading(true);

    try {
      /*
       * Current backend registration endpoint
       * accepts JSON.
       *
       * Do NOT send FormData until backend
       * has multer/file upload support.
       */

      const data =
        await apiClient<RegisterResponse>(
          "/auth/register",
          {
            method: "POST",

            body: JSON.stringify({
              name: fullName,
              email: cleanEmail,
              phone: cleanPhone,
              password,
            }),
          }
        );

      if (
        !data.success ||
        !data.user
      ) {
        throw new Error(
          data.message ||
            "Registration failed."
        );
      }

      /*
       * Auth itself comes from the
       * backend HttpOnly cookie.
       */

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
     RETURN
  ========================================================== */

  return (
    <div
      className="
        relative
        z-10
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
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
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
            scale: 1.06,
            rotate: -4,
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

        <p
          className="
            text-[9px]
            font-extrabold
            uppercase
            tracking-[0.18em]
            text-[#1F5EA8]
          "
        >
          Secure onboarding
        </p>

        <h1
          className="
            mt-1.5
            text-[28px]
            font-black
            tracking-[-0.045em]
            text-[#102A43]
            sm:text-[30px]
          "
        >
          Create account
        </h1>

        <p
          className="
            mt-1
            text-[11px]
            font-medium
            leading-5
            text-[#718296]
            sm:text-[12px]
          "
        >
          Create your secure
          digital wallet in a few
          simple steps.
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
            <div
              className="
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
              "
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          FORM
      ====================================================== */}

      <motion.form
        onSubmit={handleSubmit}
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
          duration: 0.42,
        }}
        className="
          relative
          z-20
          mt-4
          space-y-3
          pointer-events-auto
        "
      >
        {/* ===================================================
            IMAGE INPUT
        ==================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-[14px]
            border
            border-[#E3EBF3]
            bg-[#F8FAFC]
            p-2.5
          "
        >
          <label
            htmlFor="register-profile-image"
            className="
              group
              relative
              z-20
              flex
              h-[58px]
              w-[58px]
              shrink-0
              cursor-pointer
              items-center
              justify-center
              overflow-hidden
              rounded-[16px]
              border
              border-dashed
              border-[#BDCDDD]
              bg-white
              transition-all
              hover:border-[#4D95D5]
              hover:bg-[#F0F8FF]
            "
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile preview"
                className="
                  h-full
                  w-full
                  object-cover
                "
              />
            ) : (
              <Camera
                className="
                  h-5
                  w-5
                  text-[#8DA0B3]
                  transition
                  group-hover:text-[#1F5EA8]
                "
              />
            )}

            <span
              className="
                pointer-events-none
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-[#102A43]/50
                opacity-0
                transition-opacity
                group-hover:opacity-100
              "
            >
              <Camera className="h-4 w-4 text-white" />
            </span>
          </label>

          <input
            id="register-profile-image"
            name="profileImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={
              handleImageUpload
            }
            className="hidden"
          />

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

            <p
              className="
                mt-0.5
                truncate
                text-[9px]
                leading-4
                text-[#8B9AAB]
              "
            >
              {imageName ||
                "Optional. JPG, PNG or WEBP up to 5MB."}
            </p>
          </div>
        </div>

        {/* ===================================================
            FIRST + LAST NAME
        ==================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >
          <InputField
            id="register-first-name"
            name="firstName"
            label="First Name"
            value={firstName}
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
            value={lastName}
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

        {/* ===================================================
            PHONE + EMAIL
        ==================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >
          <InputField
            id="register-phone"
            name="phone"
            label="Phone Number"
            value={phone}
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
            value={email}
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

        {/* ===================================================
            PASSWORDS
        ==================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >
          <PasswordField
            id="register-password"
            name="password"
            label="Password"
            value={password}
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

        {/* ===================================================
            TERMS
        ==================================================== */}

        <label
          className="
            relative
            z-20
            flex
            cursor-pointer
            items-start
            gap-2.5
            px-1
            pt-1
          "
        >
          <input
            type="checkbox"
            checked={
              termsAccepted
            }
            onChange={(event) =>
              setTermsAccepted(
                event.target
                  .checked
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

          <span
            className="
              text-[9px]
              font-medium
              leading-5
              text-[#6E7E90]
            "
          >
            I agree to the{" "}

            <Link
              href="/terms"
              className="
                font-extrabold
                text-[#1F5EA8]
              "
            >
              Terms
            </Link>{" "}
            and{" "}

            <Link
              href="/privacy"
              className="
                font-extrabold
                text-[#1F5EA8]
              "
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

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
                  scale: 0.985,
                }
          }
          className="
            group
            relative
            z-20
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
            <span
              className="
                pointer-events-none
                absolute
                -left-12
                top-0
                h-full
                w-16
                -skew-x-12
                bg-white/10
                transition-transform
                duration-700
                group-hover:translate-x-[560px]
              "
            />
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

              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* =====================================================
          BOTTOM
      ====================================================== */}

      <p
        className="
          mt-4
          text-center
          text-[10px]
          font-medium
          text-[#778799]
        "
      >
        Already have an account?{" "}

        <Link
          href="/login"
          className="
            font-extrabold
            text-[#1F5EA8]
            hover:text-[#17466F]
          "
        >
          Sign in
        </Link>
      </p>

      <div
        className="
          mt-3
          flex
          items-center
          justify-center
          gap-2
          text-[9px]
          font-semibold
          text-[#9AA7B5]
        "
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />

        Secure digital wallet onboarding
      </div>
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

  onChange:
    (
      value: string
    ) => void;

  placeholder: string;

  icon:
    LucideIcon;

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
    <div
      className="
        relative
        z-20
        pointer-events-auto
      "
    >
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
        <Icon
          className="
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
          "
        />

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(
            event
          ) =>
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
            relative
            z-0
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
            focus:ring-blue-500/[0.07]
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

  onChange:
    (
      value: string
    ) => void;

  visible: boolean;

  onToggle:
    () => void;

  autoComplete?: string;

  disabled?: boolean;
}) {
  return (
    <div
      className="
        relative
        z-20
        pointer-events-auto
      "
    >
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
        <KeyRound
          className="
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
          "
        />

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
            focus:border-[#3E8FD9]
            focus:bg-white
            focus:ring-4
            focus:ring-blue-500/[0.07]
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
            hover:bg-blue-50
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