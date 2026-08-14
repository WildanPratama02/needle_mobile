import {
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  MinusCircle,
  FileEdit,
  TriangleAlert,
  CircleAlert,
  ShieldAlert,
  Wifi,
  WifiOff,
  MessageCircleCheck,
  MessageCircleWarning,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
}

/**
 * Docs/design.md §8 (icon-to-status mapping) + §10 (status→variant mapping),
 * copied verbatim so every screen maps the same backend enum to the same
 * badge — adding a status here is the only place that mapping should live.
 */
/**
 * `Backend/prisma/schema.prisma` `enum ExchangeState` (12 values, verified
 * against the schema, not Docs/12's narrower 3-value filter-param example).
 * Labels are the enum name humanized — not invented meanings. CREATED and
 * the 8 in-progress states share the "info" treatment (workflow underway,
 * nothing wrong yet); only COMPLETED/CANCELLED are terminal.
 */
const EXCHANGE_STATE_CONFIG: Record<string, StatusConfig> = {
  CREATED: { label: "Created", variant: "neutral", icon: FileEdit },
  OPERATOR_IDENTIFIED: { label: "Operator Identified", variant: "info", icon: RefreshCw },
  NEEDLE_SELECTED: { label: "Needle Selected", variant: "info", icon: RefreshCw },
  EXCHANGE_TYPE_SELECTED: { label: "Exchange Type Selected", variant: "info", icon: RefreshCw },
  FRAGMENT_CHECK: { label: "Fragment Check", variant: "info", icon: RefreshCw },
  CONFIRMATION_PENDING: { label: "Confirmation Pending", variant: "warning", icon: Clock },
  EVIDENCE_CAPTURED: { label: "Evidence Captured", variant: "info", icon: RefreshCw },
  NEW_NEEDLE_SELECTED: { label: "New Needle Selected", variant: "info", icon: RefreshCw },
  NEEDLE_ISSUED: { label: "Needle Issued", variant: "info", icon: RefreshCw },
  USED_NEEDLE_STORED: { label: "Used Needle Stored", variant: "info", icon: RefreshCw },
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  ...EXCHANGE_STATE_CONFIG,

  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  APPROVED: { label: "Approved", variant: "success", icon: CheckCircle2 },
  ACTIVE: { label: "Active", variant: "success", icon: CheckCircle2 },
  DELIVERED: { label: "Delivered", variant: "success", icon: CheckCircle2 },
  AVAILABLE: { label: "Available", variant: "success", icon: CheckCircle2 },
  NORMAL: { label: "Normal", variant: "success", icon: CheckCircle2 },
  /** `enum EvidenceStatus` (Backend/prisma/schema.prisma) — PENDING/FAILED already covered above. */
  UPLOADED: { label: "Uploaded", variant: "success", icon: CheckCircle2 },

  /** Fragment Status (CONTEXT.md) — NOT_FOUND is what triggers a Confirmation. */
  FOUND: { label: "Found", variant: "success", icon: CheckCircle2 },
  NOT_FOUND: { label: "Not Found", variant: "warning", icon: TriangleAlert },

  PENDING_CONFIRMATION: { label: "Pending Confirmation", variant: "warning", icon: Clock },
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  QUEUED: { label: "Queued", variant: "warning", icon: Clock },
  LOW: { label: "Low Stock", variant: "warning", icon: TriangleAlert },

  PENDING_SYNC: { label: "Pending Sync", variant: "info", icon: RefreshCw },

  FAILED: { label: "Failed", variant: "danger", icon: XCircle },
  REJECTED: { label: "Rejected", variant: "danger", icon: XCircle },
  REVOKED: { label: "Revoked", variant: "danger", icon: XCircle },
  OUT_OF_STOCK: { label: "Out of Stock", variant: "danger", icon: CircleAlert },
  NEGATIVE_STOCK_ATTEMPT: { label: "Negative Stock Attempt", variant: "danger", icon: ShieldAlert },
  UNUSUAL_MOVEMENT: { label: "Unusual Movement", variant: "danger", icon: ShieldAlert },

  CANCELLED: { label: "Cancelled", variant: "neutral", icon: MinusCircle },
  INACTIVE: { label: "Inactive", variant: "neutral", icon: MinusCircle },
  EXPIRED: { label: "Expired", variant: "neutral", icon: MinusCircle },
  DRAFT: { label: "Draft", variant: "neutral", icon: FileEdit },

  DEVICE_ONLINE: { label: "Online", variant: "success", icon: Wifi },
  DEVICE_OFFLINE: { label: "Offline", variant: "neutral", icon: WifiOff },
  WHATSAPP_SENT: { label: "Sent", variant: "success", icon: MessageCircleCheck },
  WHATSAPP_FAILED: { label: "Failed", variant: "danger", icon: MessageCircleWarning },
};

export type StatusKey = keyof typeof STATUS_CONFIG;

/** Same label a `<StatusBadge>` would render, for use in filter/select options elsewhere — one label source, not a copy. */
export function getStatusLabel(status: StatusKey | (string & {})): string {
  return STATUS_CONFIG[status]?.label ?? status;
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKey | (string & {});
  label?: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "neutral" as const, icon: MinusCircle };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(className)}>
      <Icon className="h-3.5 w-3.5" />
      {label ?? config.label}
    </Badge>
  );
}
