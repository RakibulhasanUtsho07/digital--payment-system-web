"use client";

import {
  MessageSquarePlus,
  Send,
} from "lucide-react";

import { useState } from "react";

import type { KYCNote } from "./KYCManagementTypes";

export default function KYCNotesPanel({
  notes,
  saving = false,
  onAddNote,
}: {
  notes: KYCNote[];
  saving?: boolean;
  onAddNote?: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();

    if (!trimmed || !onAddNote || saving) {
      return;
    }

    onAddNote(trimmed);
    setValue("");
  };

  return (
    <section className="rounded-[22px] border border-border bg-card p-5 text-card-foreground">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-indigo-500">
            Review Notes
          </p>

          <h3 className="mt-1 text-base font-black text-foreground">
            Compliance notes
          </h3>
        </div>

        <MessageSquarePlus className="h-4 w-4 text-indigo-500" />
      </div>

      <div className="mt-4 space-y-3">
        {notes.length > 0 ? (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-[16px] border border-border bg-muted/35 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[8px] font-black text-indigo-500">
                  {note.author}
                </p>

                <p className="text-[7px] text-muted-foreground">
                  {formatDate(note.createdAt)}
                </p>
              </div>

              <p className="mt-2 text-[9px] leading-5 text-foreground/75">
                {note.text}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-[16px] border border-dashed border-border bg-muted/35 p-4 text-[9px] text-muted-foreground">
            No review notes have been added yet.
          </p>
        )}
      </div>

      {onAddNote && (
        <div className="mt-4 border-t border-border pt-4">
          <textarea
            value={value}
            onChange={(event) =>
              setValue(event.target.value)
            }
            rows={3}
            placeholder="Add a concise internal review note..."
            className="w-full resize-none rounded-[16px] border border-border bg-background px-3 py-3 text-[10px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
          />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!value.trim() || saving}
              onClick={submit}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-[9px] font-black text-white transition hover:bg-violet-600 disabled:opacity-40"
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}