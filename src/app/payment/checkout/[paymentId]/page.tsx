"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  authenticateCheckoutCustomer,
  confirmCheckoutPayment,
  getCheckoutPayment,
  verifyCheckoutOtp,
  type CheckoutPayment,
} from "@/lib/api/merchantPaymentApi";

type CheckoutStep =
  | "loading"
  | "credentials"
  | "otp"
  | "ready"
  | "processing"
  | "success"
  | "error";

interface PageProps {
  params:
    Promise<{
      paymentId:
        string;
    }>;
}

function formatMoney(
  amount:
    string | number,

  currency:
    string
): string {
  const number =
    Number(
      amount
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return `${currency} ${amount}`;
  }

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        minimumFractionDigits:
          2,
      }
    ).format(
      number
    );
  } catch {
    return `${currency} ${number.toFixed(
      2
    )}`;
  }
}

function createMerchantRedirectUrl(
  rawUrl:
    string,

  paymentId:
    string,

  result:
    | "completed"
    | "not_completed"
): string {
  try {
    const url =
      new URL(
        rawUrl
      );

    url.searchParams.set(
      "coffer_payment_id",
      paymentId
    );

    url.searchParams.set(
      "coffer_result",
      result
    );

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export default function CheckoutPage({
  params,
}: PageProps) {
  const [
    paymentId,
    setPaymentId,
  ] =
    useState(
      ""
    );

  const [
    payment,
    setPayment,
  ] =
    useState<CheckoutPayment | null>(
      null
    );

  const [
    step,
    setStep,
  ] =
    useState<CheckoutStep>(
      "loading"
    );

  const [
    identifier,
    setIdentifier,
  ] =
    useState(
      ""
    );

  const [
    password,
    setPassword,
  ] =
    useState(
      ""
    );

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(
      false
    );

  const [
    otp,
    setOtp,
  ] =
    useState(
      ""
    );

  const [
    challengeId,
    setChallengeId,
  ] =
    useState(
      ""
    );

  const [
    checkoutToken,
    setCheckoutToken,
  ] =
    useState(
      ""
    );

  const [
    otpTarget,
    setOtpTarget,
  ] =
    useState(
      ""
    );

  const [
    sandboxOtp,
    setSandboxOtp,
  ] =
    useState(
      ""
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    walletBalance,
    setWalletBalance,
  ] =
    useState<
      number | null
    >(
      null
    );

  /* =======================================================
     PARAM
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      void params.then(
        ({
          paymentId:
            id,
        }) => {
          if (
            active
          ) {
            setPaymentId(
              id
            );
          }
        }
      );

      return () => {
        active =
          false;
      };
    },
    [
      params,
    ]
  );

  /* =======================================================
     LOAD PUBLIC CHECKOUT
  ======================================================= */

  const loadPayment =
    useCallback(
      async () => {
        if (
          !paymentId
        ) {
          return;
        }

        try {
          setStep(
            "loading"
          );

          setError(
            ""
          );

          const result =
            await getCheckoutPayment(
              paymentId
            );

          setPayment(
            result
          );

          if (
            result.status ===
            "completed"
          ) {
            setStep(
              "success"
            );

            return;
          }

          if (
            result.status !==
            "pending"
          ) {
            setError(
              `This payment is currently ${result.status}.`
            );

            setStep(
              "error"
            );

            return;
          }

          /*
           * Auto-fill sandbox identifier.
           */
          if (
            result.mode ===
              "test" &&
            result.sandbox
          ) {
            setIdentifier(
              result.sandbox.email
            );
          }

          setStep(
            "credentials"
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load checkout."
          );

          setStep(
            "error"
          );
        }
      },
      [
        paymentId,
      ]
    );

  useEffect(
    () => {
      void loadPayment();
    },
    [
      loadPayment,
    ]
  );

  /* =======================================================
     PASSWORD → OTP
  ======================================================= */

  const handleAuthenticate =
    async () => {
      if (
        !paymentId ||
        !identifier.trim() ||
        !password
      ) {
        setError(
          "Email/phone and password are required."
        );

        return;
      }

      try {
        setError(
          ""
        );

        const result =
          await authenticateCheckoutCustomer({
            paymentId,

            identifier:
              identifier.trim(),

            password,
          });

        setChallengeId(
          result.challengeId
        );

        setOtpTarget(
          result.target
        );

        setSandboxOtp(
          result.testOtp ||
            ""
        );

        setOtp(
          result.testOtp ||
            ""
        );

        setStep(
          "otp"
        );
      } catch (
        authError
      ) {
        setError(
          authError instanceof
            Error
            ? authError.message
            : "Unable to verify credentials."
        );
      }
    };

  /* =======================================================
     OTP VERIFY
  ======================================================= */

  const handleVerifyOtp =
    async () => {
      if (
        !challengeId ||
        !otp.trim()
      ) {
        setError(
          "Verification code is required."
        );

        return;
      }

      try {
        setError(
          ""
        );

        const result =
          await verifyCheckoutOtp({
            paymentId,

            challengeId,

            otp:
              otp.trim(),
          });

        setCheckoutToken(
          result.checkoutToken
        );

        setStep(
          "ready"
        );
      } catch (
        otpError
      ) {
        setError(
          otpError instanceof
            Error
            ? otpError.message
            : "Unable to verify OTP."
        );
      }
    };

  /* =======================================================
     PAY
  ======================================================= */

  const handlePay =
    async () => {
      if (
        !checkoutToken
      ) {
        setError(
          "Checkout verification is required."
        );

        return;
      }

      try {
        setStep(
          "processing"
        );

        setError(
          ""
        );

        const result =
          await confirmCheckoutPayment(
            paymentId,
            checkoutToken
          );

        if (
          result.wallet
        ) {
          setWalletBalance(
            result.wallet.balance
          );
        }

        setPayment(
          (
            current
          ) =>
            current
              ? {
                  ...current,
                  status:
                    result.payment.status,
                  authorizedAt:
                    result.payment.authorizedAt,
                  capturedAt:
                    result.payment.capturedAt,
                  completedAt:
                    result.payment.completedAt,
                }
              : current
        );

        setStep(
          "success"
        );
      } catch (
        paymentError
      ) {
        setError(
          paymentError instanceof
            Error
            ? paymentError.message
            : "Payment failed."
        );

        setStep(
          "ready"
        );
      }
    };

  /* =======================================================
     REDIRECT AFTER SUCCESS
  ======================================================= */

  useEffect(
    () => {
      if (
        step !==
          "success" ||
        !payment?.returnUrl
      ) {
        return;
      }

      const destination =
        createMerchantRedirectUrl(
          payment.returnUrl,
          payment.id,
          "completed"
        );

      const timer =
        window.setTimeout(
          () => {
            window.location.assign(
              destination
            );
          },
          1800
        );

      return () =>
        window.clearTimeout(
          timer
        );
    },
    [
      step,
      payment,
    ]
  );

  const returnWithoutPaying =
    () => {
      if (
        payment?.cancelUrl
      ) {
        window.location.assign(
          createMerchantRedirectUrl(
            payment.cancelUrl,
            payment.id,
            "not_completed"
          )
        );

        return;
      }

      window.history.back();
    };

  const formattedAmount =
    useMemo(
      () =>
        payment
          ? formatMoney(
              payment.amount,
              payment.currency
            )
          : "",
      [
        payment,
      ]
    );

  const merchantName =
    payment?.merchant
      ?.displayName ||
    payment?.merchant
      ?.businessName ||
    "Coffer Merchant";

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    step ===
    "loading"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />

          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading secure checkout...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    step ===
      "error" ||
    !payment
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <CircleAlert className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-black text-slate-950">
            Checkout unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadPayment()
            }
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  if (
    step ===
      "success"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
            Payment successful
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {formattedAmount}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Payment to{" "}
            <strong>
              {merchantName}
            </strong>{" "}
            completed successfully.
          </p>

          {walletBalance !==
            null && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                {payment.mode ===
                "test"
                  ? "Sandbox balance"
                  : "Wallet balance"}
              </p>

              <p className="mt-1 text-lg font-black text-slate-950">
                {formatMoney(
                  walletBalance,
                  payment.currency
                )}
              </p>
            </div>
          )}

          {payment.returnUrl && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />

              Returning to merchant...
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-950">
                Coffer
              </p>

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Secure Checkout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Protected
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {payment.mode ===
          "test" && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">
              Coffer Sandbox
            </p>

            <p className="mt-1 text-xs text-amber-700">
              No real wallet balance will be changed.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                <Store className="h-5 w-5 text-violet-600" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Paying to
                </p>

                <p className="mt-1 text-lg font-black text-slate-950">
                  {merchantName}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                Total
              </p>

              <p className="mt-2 text-4xl font-black">
                {formattedAmount}
              </p>
            </div>

            {payment.mode ===
              "test" &&
              payment.sandbox && (
              <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                  Sandbox credentials
                </p>

                <div className="mt-3 space-y-1 text-xs text-violet-900">
                  <p>
                    Email:{" "}
                    <strong>
                      {
                        payment
                          .sandbox
                          .email
                      }
                    </strong>
                  </p>

                  <p>
                    Phone:{" "}
                    <strong>
                      {
                        payment
                          .sandbox
                          .phone
                      }
                    </strong>
                  </p>

                  <p>
                    Password:{" "}
                    <strong>
                      {
                        payment
                          .sandbox
                          .password
                      }
                    </strong>
                  </p>

                  <p>
                    OTP:{" "}
                    <strong>
                      {
                        payment
                          .sandbox
                          .otp
                      }
                    </strong>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              AUTH / OTP / PAYMENT
          ================================================= */}

          <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl">
            {step ===
              "credentials" && (
              <>
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-violet-600" />

                  <div>
                    <h2 className="font-black text-slate-950">
                      Verify your Coffer account
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      No dashboard login required.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-xs font-bold text-slate-600">
                    Email or phone
                  </label>

                  <div className="relative mt-2">
                    {identifier.includes(
                      "@"
                    ) ? (
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    ) : (
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    )}

                    <input
                      value={
                        identifier
                      }
                      onChange={(
                        event
                      ) =>
                        setIdentifier(
                          event
                            .target
                            .value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-violet-500"
                      placeholder="Email or phone"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-600">
                    Coffer password
                  </label>

                  <div className="relative mt-2">
                    <input
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
                          event
                            .target
                            .value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm outline-none focus:border-violet-500"
                      placeholder="Password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                      className="absolute right-3 top-3.5 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 text-xs font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleAuthenticate()
                  }
                  className="mt-6 w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white"
                >
                  Continue
                </button>
              </>
            )}

            {step ===
              "otp" && (
              <>
                <h2 className="text-lg font-black text-slate-950">
                  Verify OTP
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Enter the code sent to{" "}
                  <strong>
                    {otpTarget}
                  </strong>.
                </p>

                {sandboxOtp && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
                    Sandbox OTP:{" "}
                    {sandboxOtp}
                  </div>
                )}

                <input
                  value={
                    otp
                  }
                  onChange={(
                    event
                  ) =>
                    setOtp(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  inputMode="numeric"
                  maxLength={
                    6
                  }
                  className="mt-6 h-14 w-full rounded-2xl border border-slate-200 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-violet-500"
                  placeholder="000000"
                />

                {error && (
                  <p className="mt-4 text-xs font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleVerifyOtp()
                  }
                  className="mt-5 w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white"
                >
                  Verify code
                </button>
              </>
            )}

            {step ===
              "ready" && (
              <>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />

                  <h2 className="mt-3 font-black text-emerald-950">
                    Account verified
                  </h2>

                  <p className="mt-1 text-xs text-emerald-700">
                    Password and OTP verification completed.
                  </p>
                </div>

                {error && (
                  <p className="mt-4 text-xs font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handlePay()
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white"
                >
                  <LockKeyhole className="h-4 w-4" />

                  Pay {formattedAmount}
                </button>

                <button
                  type="button"
                  onClick={
                    returnWithoutPaying
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600"
                >
                  <XCircle className="h-4 w-4" />

                  Return without paying
                </button>
              </>
            )}

            {step ===
              "processing" && (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />

                <p className="mt-4 text-sm font-bold text-slate-600">
                  Processing payment...
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}