/**
 * Centralized icon exports using lucide-react.
 *
 * All components should import icons from this file to ensure
 * consistent sizing, stroke width, and visual weight across the app.
 *
 * Usage:
 *   import { IconHome, IconBook, IconArrowRight } from '../components/Icons';
 *   <IconHome className="w-6 h-6" />
 */

export {
  // ── Navigation / sidebar ──────────────────────────────────
  LayoutDashboard as IconHome,
  Globe as IconGlobe,
  List as IconList,
  BookOpen as IconBook,
  Map as IconMap,
  Layers as IconLayers,
  BarChart3 as IconChart,
  Trophy as IconTrophy,
  Users as IconPeople,
  Star as IconStar,
  Shield as IconShield,
  FolderOpen as IconFolder,
  Settings as IconSettings,
  Bot as IconBot,

  // ── User / auth ───────────────────────────────────────────
  User as IconUser,
  LogOut as IconLogOut,
  ChevronDown as IconChevronDown,
  ChevronUp as IconChevronUp,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,

  // ── Actions ───────────────────────────────────────────────
  Plus as IconPlus,
  Upload as IconUpload,
  ArrowRight as IconArrowRight,
  ArrowUpRight as IconArrowUpRight,
  ExternalLink as IconExternalLink,
  Search as IconSearch,
  Check as IconCheck,
  X as IconX,
  RefreshCw as IconRefresh,
  Camera as IconCamera,
  KeyRound as IconKey,

  // ── Content / study ───────────────────────────────────────
  GraduationCap as IconGraduationCap,
  ClipboardCheck as IconClipboardCheck,
  Volume2 as IconVolume,
  Pen as IconPen,
  Shuffle as IconShuffle,
  Headphones as IconHeadphones,
  Type as IconType,

  // ── Stats / progress ──────────────────────────────────────
  Flame as IconFlame,
  BookMarked as IconBookMarked,
  Timer as IconTimer,
  Target as IconTarget,
  Brain as IconBrain,
  Calendar as IconCalendar,
  Sparkles as IconSparkles,
  Award as IconAward,
  TrendingUp as IconTrendingUp,

  // ── Communication ─────────────────────────────────────────
  Mail as IconMail,
  MessageCircle as IconMessageCircle,
  MessageSquareHeart as IconFeedback,

  // ── Misc ──────────────────────────────────────────────────
  AlertCircle as IconAlertCircle,
  CheckCircle as IconCheckCircle,
  XCircle as IconXCircle,
  Info as IconInfo,
  Briefcase as IconBriefcase,
  Heart as IconHeart,
  Flag as IconFlag,
  Plane as IconPlane,
  Tv as IconTv,
  CircleCheckBig as IconCircleCheckBig,
  Square as IconSquare,
} from 'lucide-react';

/**
 * Kanji icon — custom component for the 漢 character icon used
 * in navigation. Not available in lucide, uses a serif character.
 */
export function IconKanji({ className = 'w-6 h-6', ...props }) {
  return (
    <span
      className={`font-black leading-none inline-flex items-center justify-center ${className}`}
      style={{ fontFamily: 'serif' }}
      aria-hidden="true"
      {...props}
    >
      漢
    </span>
  );
}
