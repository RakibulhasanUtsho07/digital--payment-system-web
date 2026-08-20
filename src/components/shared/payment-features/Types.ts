import type { LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
}

export interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface TxTemplate {
  name: string;
  to: string;
  currency: string;
  min: number;
  max: number;
  decimals: number;
}

export interface Tx {
  id: number;
  name: string;
  amount: string;
  to: string;
  time: number; // ms epoch
  leaving?: boolean;
}