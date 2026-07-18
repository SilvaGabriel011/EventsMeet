import { EventCategory } from "./types";

export type ThemeId = "neon" | "coast" | "mono" | "aurora";

export interface Theme {
  id: ThemeId;
  name: string;
  /** Small color dot shown in the theme picker. */
  swatch: string;
  /** Full-viewport background behind the app. */
  wrapper: string;
  logoText: string;
  logoAccent: string;
  tagline: string;
  taglineLive: string;
  headerBtn: string;
  badge: string;
  chipActive: string;
  chipIdle: string;
  banner: string;
  surface: string;
  surfaceText: string;
  cardRadius: string;
  /** Solid base color under the card gradient — needed when gradients are translucent. */
  cardBase: string;
  cardRing: string;
  infoOverlay: string;
  priceChip: string;
  viewLink: string;
  undoBtn: string;
  nopeBtn: string;
  likeBtn: string;
  primaryBtn: string;
  panelBg: string;
  panelBorder: string;
  panelTitle: string;
  panelMuted: string;
  panelCard: string;
  panelLink: string;
  panelClose: string;
  pickerBg: string;
  pickerItem: string;
  pickerItemActive: string;
  gradients: Record<EventCategory, string>;
}

const NEON: Theme = {
  id: "neon",
  name: "Neon Night",
  swatch: "bg-gradient-to-br from-fuchsia-500 to-purple-800",
  wrapper:
    "bg-[#0b0714] bg-[radial-gradient(ellipse_at_top,#1c1030_0%,#0b0714_55%,#060309_100%)]",
  logoText: "text-white",
  logoAccent: "text-fuchsia-500",
  tagline: "text-white/40",
  taglineLive: "text-emerald-400",
  headerBtn: "bg-white/10 text-white hover:bg-white/20",
  badge: "bg-fuchsia-500 text-white",
  chipActive: "bg-fuchsia-600 text-white",
  chipIdle: "bg-white/10 text-white/70 hover:bg-white/20",
  banner: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  surface: "bg-white/5 ring-1 ring-white/10",
  surfaceText: "text-white/60",
  cardRadius: "rounded-3xl",
  cardBase: "",
  cardRing: "ring-1 ring-white/10",
  infoOverlay: "from-black/80 via-black/60 to-transparent",
  priceChip: "bg-white/15 text-white",
  viewLink: "text-white/90 decoration-white/40 hover:text-white",
  undoBtn: "bg-white/10 text-amber-400 hover:bg-white/20",
  nopeBtn: "bg-white/10 text-rose-500 hover:bg-white/20",
  likeBtn:
    "bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white shadow-fuchsia-900/50",
  primaryBtn: "bg-fuchsia-600 text-white hover:bg-fuchsia-500",
  panelBg: "bg-zinc-950 ring-1 ring-white/10",
  panelBorder: "border-white/10",
  panelTitle: "text-white",
  panelMuted: "text-white/50",
  panelCard: "bg-white/5 ring-1 ring-white/10",
  panelLink: "text-fuchsia-400 hover:text-fuchsia-300",
  panelClose: "text-white/70 hover:bg-white/10 hover:text-white",
  pickerBg: "bg-zinc-900 ring-1 ring-white/15",
  pickerItem: "text-white/80 hover:bg-white/10",
  pickerItemActive: "bg-white/15 text-white",
  gradients: {
    Music: "from-fuchsia-600 via-purple-700 to-indigo-900",
    Nightlife: "from-violet-600 via-indigo-800 to-slate-950",
    "Food & Drink": "from-orange-500 via-rose-600 to-purple-900",
    "Arts & Culture": "from-teal-500 via-cyan-700 to-blue-950",
    Comedy: "from-amber-400 via-orange-600 to-rose-900",
    "Sports & Fitness": "from-emerald-500 via-teal-700 to-cyan-950",
    Markets: "from-lime-500 via-emerald-700 to-teal-950",
    Family: "from-sky-400 via-blue-600 to-indigo-900",
  },
};

const COAST: Theme = {
  id: "coast",
  name: "Sunset Coast",
  swatch: "bg-gradient-to-br from-orange-400 to-rose-500",
  wrapper: "bg-[linear-gradient(180deg,#fff8ef_0%,#ffe9d6_45%,#ffd9c4_100%)]",
  logoText: "text-zinc-900",
  logoAccent: "text-orange-500",
  tagline: "text-zinc-400",
  taglineLive: "text-emerald-600",
  headerBtn: "bg-white text-orange-500 shadow-md shadow-orange-900/10 hover:bg-orange-50",
  badge: "bg-rose-500 text-white",
  chipActive: "bg-orange-500 text-white shadow-md shadow-orange-500/30",
  chipIdle: "bg-white/80 text-zinc-600 shadow-sm hover:bg-white",
  banner: "bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/30",
  surface: "bg-white/70 ring-1 ring-orange-900/10",
  surfaceText: "text-zinc-500",
  cardRadius: "rounded-3xl",
  cardBase: "",
  cardRing: "ring-1 ring-orange-900/10",
  infoOverlay: "from-black/75 via-black/50 to-transparent",
  priceChip: "bg-white/25 text-white",
  viewLink: "text-white/90 decoration-white/40 hover:text-white",
  undoBtn: "bg-white text-amber-500 shadow-md shadow-orange-900/10 hover:bg-orange-50",
  nopeBtn: "bg-white text-rose-500 shadow-md shadow-orange-900/10 hover:bg-orange-50",
  likeBtn:
    "bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-orange-500/40",
  primaryBtn: "bg-orange-500 text-white hover:bg-orange-400",
  panelBg: "bg-[#fff8ef] ring-1 ring-orange-900/10",
  panelBorder: "border-orange-900/10",
  panelTitle: "text-zinc-900",
  panelMuted: "text-zinc-500",
  panelCard: "bg-white shadow-sm ring-1 ring-orange-900/5",
  panelLink: "text-orange-600 hover:text-orange-500",
  panelClose: "text-zinc-500 hover:bg-orange-100 hover:text-zinc-900",
  pickerBg: "bg-white shadow-lg ring-1 ring-orange-900/10",
  pickerItem: "text-zinc-600 hover:bg-orange-50",
  pickerItemActive: "bg-orange-100 text-zinc-900",
  gradients: {
    Music: "from-rose-400 via-pink-600 to-purple-800",
    Nightlife: "from-purple-500 via-fuchsia-700 to-rose-900",
    "Food & Drink": "from-amber-400 via-orange-500 to-rose-700",
    "Arts & Culture": "from-orange-300 via-rose-500 to-fuchsia-800",
    Comedy: "from-yellow-400 via-amber-500 to-orange-700",
    "Sports & Fitness": "from-teal-400 via-emerald-600 to-cyan-800",
    Markets: "from-lime-400 via-amber-500 to-orange-700",
    Family: "from-sky-400 via-cyan-500 to-blue-700",
  },
};

const MONO: Theme = {
  id: "mono",
  name: "Minimal Mono",
  swatch: "bg-gradient-to-br from-zinc-200 to-zinc-800",
  wrapper: "bg-zinc-100",
  logoText: "text-zinc-900",
  logoAccent: "text-zinc-400",
  tagline: "text-zinc-400",
  taglineLive: "text-zinc-600",
  headerBtn: "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50",
  badge: "bg-zinc-900 text-white",
  chipActive: "bg-zinc-900 text-white",
  chipIdle: "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50",
  banner: "bg-zinc-200 text-zinc-700 ring-1 ring-zinc-300",
  surface: "bg-white ring-1 ring-zinc-200",
  surfaceText: "text-zinc-500",
  cardRadius: "rounded-2xl",
  cardBase: "",
  cardRing: "ring-1 ring-zinc-900/10",
  infoOverlay: "from-black/85 via-black/60 to-transparent",
  priceChip: "bg-white/20 text-white",
  viewLink: "text-white decoration-white/40 hover:text-zinc-200",
  undoBtn: "bg-white text-zinc-500 ring-1 ring-zinc-300 hover:bg-zinc-50",
  nopeBtn: "bg-white text-zinc-900 ring-1 ring-zinc-300 hover:bg-zinc-50",
  likeBtn: "bg-zinc-900 text-white shadow-zinc-900/30",
  primaryBtn: "bg-zinc-900 text-white hover:bg-zinc-700",
  panelBg: "bg-white ring-1 ring-zinc-200",
  panelBorder: "border-zinc-200",
  panelTitle: "text-zinc-900",
  panelMuted: "text-zinc-500",
  panelCard: "bg-zinc-50 ring-1 ring-zinc-200",
  panelLink: "text-zinc-900 underline underline-offset-2 hover:text-zinc-600",
  panelClose: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
  pickerBg: "bg-white shadow-lg ring-1 ring-zinc-200",
  pickerItem: "text-zinc-600 hover:bg-zinc-100",
  pickerItemActive: "bg-zinc-900 text-white",
  gradients: {
    Music: "from-zinc-700 via-zinc-800 to-black",
    Nightlife: "from-zinc-700 via-zinc-800 to-black",
    "Food & Drink": "from-zinc-700 via-zinc-800 to-black",
    "Arts & Culture": "from-zinc-700 via-zinc-800 to-black",
    Comedy: "from-zinc-700 via-zinc-800 to-black",
    "Sports & Fitness": "from-zinc-700 via-zinc-800 to-black",
    Markets: "from-zinc-700 via-zinc-800 to-black",
    Family: "from-zinc-700 via-zinc-800 to-black",
  },
};

const AURORA: Theme = {
  id: "aurora",
  name: "Aurora Glass",
  swatch: "bg-gradient-to-br from-teal-400 to-indigo-700",
  wrapper:
    "bg-[#050810] bg-[radial-gradient(60%_50%_at_15%_5%,#0e4d45_0%,transparent_60%),radial-gradient(50%_40%_at_90%_10%,#3b1d6e_0%,transparent_60%),radial-gradient(80%_60%_at_50%_105%,#0b2a5e_0%,transparent_70%)]",
  logoText: "text-white",
  logoAccent: "text-teal-300",
  tagline: "text-white/40",
  taglineLive: "text-teal-300",
  headerBtn: "bg-white/10 text-teal-200 backdrop-blur hover:bg-white/20",
  badge: "bg-teal-400 text-slate-950",
  chipActive: "bg-teal-400/90 text-slate-950",
  chipIdle: "bg-white/10 text-white/70 backdrop-blur hover:bg-white/20",
  banner: "bg-teal-400/10 text-teal-200 ring-1 ring-teal-400/30",
  surface: "bg-white/5 backdrop-blur ring-1 ring-white/15",
  surfaceText: "text-white/60",
  cardRadius: "rounded-[2rem]",
  cardBase: "bg-slate-950",
  cardRing: "ring-1 ring-white/20",
  infoOverlay: "from-slate-950/85 via-slate-950/55 to-transparent",
  priceChip: "bg-white/15 text-white backdrop-blur",
  viewLink: "text-teal-200 decoration-teal-200/40 hover:text-white",
  undoBtn: "bg-white/10 text-amber-300 backdrop-blur hover:bg-white/20",
  nopeBtn: "bg-white/10 text-rose-400 backdrop-blur hover:bg-white/20",
  likeBtn:
    "bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 shadow-teal-500/40",
  primaryBtn: "bg-teal-400 text-slate-950 hover:bg-teal-300",
  panelBg: "bg-slate-950/95 backdrop-blur ring-1 ring-white/10",
  panelBorder: "border-white/10",
  panelTitle: "text-white",
  panelMuted: "text-white/50",
  panelCard: "bg-white/5 ring-1 ring-white/15",
  panelLink: "text-teal-300 hover:text-teal-200",
  panelClose: "text-white/70 hover:bg-white/10 hover:text-white",
  pickerBg: "bg-slate-900 ring-1 ring-white/15",
  pickerItem: "text-white/80 hover:bg-white/10",
  pickerItemActive: "bg-white/15 text-white",
  gradients: {
    Music: "from-indigo-500/90 via-violet-700/90 to-slate-950",
    Nightlife: "from-violet-500/90 via-indigo-800/90 to-slate-950",
    "Food & Drink": "from-cyan-500/90 via-sky-700/90 to-slate-950",
    "Arts & Culture": "from-teal-400/90 via-cyan-700/90 to-slate-950",
    Comedy: "from-sky-400/90 via-indigo-600/90 to-slate-950",
    "Sports & Fitness": "from-emerald-400/90 via-teal-700/90 to-slate-950",
    Markets: "from-teal-400/90 via-emerald-700/90 to-slate-950",
    Family: "from-sky-400/90 via-blue-700/90 to-slate-950",
  },
};

export const THEMES: Record<ThemeId, Theme> = {
  neon: NEON,
  coast: COAST,
  mono: MONO,
  aurora: AURORA,
};

export const DEFAULT_THEME: ThemeId = "neon";

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && v in THEMES;
}
