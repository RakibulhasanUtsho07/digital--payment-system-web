"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Eye,
  FileText,
  Loader2,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  KYCPrivateDocuments,
  KYCRequest,
} from "./KYCManagementTypes";

export default function KYCDocumentViewer({
  request,
  documents,
  loading,
  error,
}: {
  request: KYCRequest;
  documents: KYCPrivateDocuments;
  loading: boolean;
  error: string;
}) {
  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null
    );

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[22px] border border-[#DCE7F0] bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-600" />

          <p className="mt-3 text-[9px] font-black text-slate-600">
            Loading secure documents...
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: `${request.documentType} Front`,
      value: documents.frontUrl,
    },
    {
      label: `${request.documentType} Back`,
      value: documents.backUrl,
    },
    {
      label: "Selfie",
      value: documents.selfieUrl,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        {error && (
          <div className="rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-[9px] font-semibold text-rose-600">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.label}
              className="overflow-hidden rounded-[22px] border border-[#DCE7F0] bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-[9px] font-black text-[#0F2745]">
                  {card.label}
                </p>

                {card.value && (
                  <button
                    type="button"
                    onClick={() => setPreview(card.value || null)}
                    className="inline-flex items-center gap-1 text-[8px] font-black text-blue-600"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                )}
              </div>

              <div className="flex min-h-[190px] items-center justify-center bg-[#F8FBFD] p-3">
                {card.value ? (
                  <button
                    type="button"
                    onClick={() => setPreview(card.value || null)}
                    className="group relative h-[170px] w-full overflow-hidden rounded-[16px] border border-slate-200 bg-white"
                  >
                    <img
                      src={card.value}
                      alt={card.label}
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.015]"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/10">
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-[8px] font-black text-[#174A7A] opacity-0 shadow transition group-hover:opacity-100">
                        Open Preview
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="text-center">
                    <FileText className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-2 text-[9px] font-semibold text-slate-400">
                      Document unavailable
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-[18px] border border-amber-100 bg-amber-50/60 p-4">
          <p className="text-[9px] leading-5 text-amber-800/75">
            These are temporary secure document URLs intended only for the active admin review.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] flex items-center justify-center bg-[#071B30]/80 p-4 backdrop-blur-md"
            onMouseDown={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              onMouseDown={(event) => event.stopPropagation()}
              className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-[24px] border border-white/10 bg-white p-2 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/65 text-white backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>

              <img
                src={preview}
                alt="KYC document preview"
                className="max-h-[86vh] w-auto rounded-[18px] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
