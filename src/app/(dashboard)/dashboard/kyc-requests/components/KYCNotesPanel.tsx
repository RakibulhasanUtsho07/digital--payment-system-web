"use client";

import {
  MessageSquarePlus,
  Send,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  KYCNote,
} from "./KYCManagementTypes";

export default function KYCNotesPanel({
  notes,
  saving = false,
  onAddNote,
}: {
  notes: KYCNote[];
  saving?: boolean;
  onAddNote?: (text: string) => void;
}) {
  const [
    value,
    setValue,
  ] =
    useState(
      ""
    );

  const submit =
    () => {
      const trimmed =
        value.trim();

      if (!trimmed || !onAddNote || saving) {
        return;
      }

      onAddNote(trimmed);
      setValue("");
    };

  return (
    <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
            Review Notes
          </p>

          <h3 className="mt-1 text-base font-black text-[#0F2745]">
            Compliance notes
          </h3>
        </div>

        <MessageSquarePlus className="h-4 w-4 text-blue-500" />
      </div>

      <div className="mt-4 space-y-3">
        {notes.length > 0 ? (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-[16px] border border-slate-100 bg-[#FAFCFE] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[8px] font-black text-[#174A7A]">
                  {note.author}
                </p>

                <p className="text-[7px] text-slate-400">
                  {formatDate(note.createdAt)}
                </p>
              </div>

              <p className="mt-2 text-[9px] leading-5 text-slate-600">
                {note.text}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-4 text-[9px] text-slate-400">
            No review notes have been added yet.
          </p>
        )}
      </div>

      {onAddNote && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={3}
            placeholder="Add a concise internal review note..."
            className="w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100/60"
          />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!value.trim() || saving}
              onClick={submit}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1F5EA8] px-3 text-[9px] font-black text-white disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Add Note"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}
