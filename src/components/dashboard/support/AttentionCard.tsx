import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AttentionCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  delay,
  onClick,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  tone: "rose" | "amber" | "violet" | "cyan";
  delay: number;
  onClick: () => void;
}) {
  const toneMap = {
    rose: {
      icon: "bg-rose-50 text-rose-600",
      action: "text-rose-600",
      line: "bg-rose-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      action: "text-amber-700",
      line: "bg-amber-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      action: "text-violet-600",
      line: "bg-violet-500",
    },
    cyan: {
      icon: "bg-cyan-50 text-cyan-700",
      action: "text-cyan-700",
      line: "bg-cyan-500",
    },
  }[tone];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-[22px] border border-[#DCE7F0] bg-white p-4 text-left shadow-[0_8px_28px_rgba(15,39,69,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,39,69,0.08)]"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${toneMap.line}`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneMap.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-2xl font-black text-[#0F2745]">{value}</span>
      </div>
      <h3 className="mt-4 text-sm font-black text-[#0F2745]">{title}</h3>
      <p className="mt-1 min-h-10 text-[11px] leading-5 text-slate-500">
        {description}
      </p>
      <span className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black ${toneMap.action}`}>
        Review queue
        <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </motion.button>
  );
}
