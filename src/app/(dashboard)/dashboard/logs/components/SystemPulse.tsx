"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Bell, Database, Gauge, Globe, Lock, Server } from "lucide-react";
import { motion } from "framer-motion";

export interface PulseNode {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  x: number;
  y: number;
  responseTimeMs: number;
  errorRate: number;
  requestCount?: string;
  lastSeenAt?: string | null;
}

const iconForNode = (id: string, label: string) => {
  const key = `${id} ${label}`.toLowerCase();
  if (key.includes("auth")) return Lock;
  if (key.includes("database") || key.includes("db")) return Database;
  if (key.includes("kyc")) return Activity;
  if (key.includes("notif")) return Bell;
  return Globe;
};

export function SystemPulse({ nodes }: { nodes: PulseNode[] }) {
  const [selectedId, setSelectedId] = useState(nodes[0]?.id ?? "");

  useEffect(() => {
    if (!nodes.length) {
      setSelectedId("");
      return;
    }

    if (!nodes.some((node) => node.id === selectedId)) {
      setSelectedId(nodes[0]!.id);
    }
  }, [nodes, selectedId]);

  const selected = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? nodes[0],
    [nodes, selectedId]
  );

  const statusText =
    selected?.status === "error"
      ? "Critical"
      : selected?.status === "warn"
        ? "Watch"
        : "Healthy";

  if (!nodes.length) {
    return (
      <div className="mt-4 flex min-h-[340px] items-center justify-center rounded-[24px] border border-white/10 bg-[#08182B] px-6 text-center text-xs leading-6 text-blue-100/55">
        No service telemetry has been recorded for the selected range yet.
      </div>
    );
  }

  return (
    <div className="mt-4 grid min-h-[340px] gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-white/10 bg-[#08182B]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_36%)]" />

        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-35">
          {nodes.map((node, index) => (
            <motion.line
              key={`line-${node.id}`}
              x1="50%"
              y1="50%"
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke={
                node.status === "error"
                  ? "#fb7185"
                  : node.status === "warn"
                    ? "#fbbf24"
                    : "#22d3ee"
              }
              strokeWidth="1.5"
              strokeDasharray="5 8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.75 }}
              transition={{ duration: 1.2, delay: index * 0.08 }}
            />
          ))}
        </svg>

        <motion.div
          className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-300/35 bg-[#0B223C] shadow-[0_0_50px_rgba(34,211,238,0.12)]"
          animate={{
            boxShadow: [
              "0 0 24px rgba(34,211,238,0.08)",
              "0 0 58px rgba(34,211,238,0.22)",
              "0 0 24px rgba(34,211,238,0.08)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 3.4 }}
        >
          <motion.div
            className="absolute inset-[-18px] rounded-full border border-cyan-300/10"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
          />
          <Server className="h-6 w-6 text-cyan-300" />
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
            Core
          </span>
        </motion.div>

        {nodes.map((node, index) => {
          const Icon = iconForNode(node.id, node.label);
          const active = node.id === selectedId;
          const tone =
            node.status === "error"
              ? "border-rose-400/40 text-rose-300 shadow-[0_0_24px_rgba(251,113,133,0.12)]"
              : node.status === "warn"
                ? "border-amber-300/40 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.10)]"
                : "border-cyan-300/25 text-cyan-200";

          return (
            <motion.button
              key={node.id}
              type="button"
              onClick={() => setSelectedId(node.id)}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.06 }}
              transition={{ delay: 0.2 + index * 0.08, type: "spring" }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-[#0B1F36] transition ${tone} ${
                  active ? "ring-2 ring-cyan-300/25" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span
                className={`max-w-[110px] truncate rounded-full border px-2 py-1 text-[10px] font-bold ${
                  active
                    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                    : "border-white/5 bg-[#061323]/80 text-blue-100/65"
                }`}
              >
                {node.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-cyan-300" />
          <p className="text-xs font-black text-white">Node Telemetry</p>
        </div>

        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-3"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100/45">
                Service
              </p>
              <p className="mt-1 text-lg font-black text-white">{selected.label}</p>
            </div>

            <Metric label="State" value={statusText} />
            <Metric label="Response" value={`${selected.responseTimeMs} ms`} />
            <Metric label="Error rate" value={`${selected.errorRate.toFixed(2)}%`} />
            <Metric label="Requests" value={selected.requestCount ?? "—"} />

            <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-[10px] leading-5 text-blue-100/65">
              {selected.lastSeenAt
                ? `Last observed ${new Date(selected.lastSeenAt).toLocaleString()}.`
                : "No recent observation timestamp is available."}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#07172A]/60 px-3 py-2.5">
      <span className="text-[10px] font-semibold text-blue-100/50">{label}</span>
      <span className="text-[11px] font-black text-cyan-100">{value}</span>
    </div>
  );
}
