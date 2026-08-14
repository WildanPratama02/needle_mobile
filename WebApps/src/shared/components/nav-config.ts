import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  Boxes,
  PackagePlus,
  Truck,
  SlidersHorizontal,
  Syringe,
  Factory,
  ShoppingCart,
  MapPin,
  Users,
  CreditCard,
  Cpu,
  KeyRound,
  FileClock,
  BarChart3,
} from "lucide-react";

import { PERMISSIONS, type PermissionCode } from "@/core/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Does this screen exist yet? Unbuilt entries stay listed — this menu
   * mirrors Docs/18 §7 and doubles as the roadmap — but render visibly
   * unavailable rather than linking to a 404. The same for every user.
   */
  available?: boolean;
  /**
   * May this user open it? An entry the user lacks the permission for is
   * hidden entirely, not greyed out — a disabled entry still enumerates
   * capabilities they do not have.
   *
   * Deliberately separate from `available`: the two answer different
   * questions, and conflating them either hides the roadmap or advertises
   * refusals. An entry declaring no permission is visible to every
   * authenticated user.
   */
  permission?: PermissionCode;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
}

/**
 * The sidebar baseline from Docs/18-WebApps-UI-UX-Specification.md §7.
 *
 * Every entry carries the permission its screen's endpoint already requires,
 * including the unbuilt ones — so when a screen lands, its visibility is
 * already correct rather than needing a second edit.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
    ],
  },
  {
    label: "Transactions",
    items: [
      {
        label: "Exchange Transactions",
        href: "/transactions/exchange",
        icon: ArrowLeftRight,
        permission: PERMISSIONS.EXCHANGE_VIEW,
      },
      {
        label: "Confirmation",
        href: "/transactions/confirmation",
        icon: ShieldCheck,
        permission: PERMISSIONS.CONFIRMATION_VIEW,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Stock Overview",
        href: "/inventory/stock",
        icon: Boxes,
        available: false,
        permission: PERMISSIONS.STOCK_VIEW,
      },
      {
        label: "Stock Movement",
        href: "/inventory/movement",
        icon: FileClock,
        available: false,
        permission: PERMISSIONS.STOCK_VIEW,
      },
      {
        label: "Receiving",
        href: "/inventory/receiving",
        icon: PackagePlus,
        available: false,
        permission: PERMISSIONS.STOCK_RECEIVE,
      },
      {
        label: "Transfer",
        href: "/inventory/transfer",
        icon: Truck,
        available: false,
        permission: PERMISSIONS.STOCK_TRANSFER,
      },
      {
        label: "Adjustment",
        href: "/inventory/adjustment",
        icon: SlidersHorizontal,
        available: false,
        permission: PERMISSIONS.STOCK_ADJUST,
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        label: "Needle Type",
        href: "/master-data/needle-type",
        icon: Syringe,
        permission: PERMISSIONS.MASTER_VIEW,
      },
      {
        label: "Exchange Type",
        href: "/master-data/exchange-type",
        icon: ArrowLeftRight,
        permission: PERMISSIONS.MASTER_VIEW,
      },
      {
        label: "Factory",
        href: "/master-data/factory",
        icon: Factory,
        permission: PERMISSIONS.MASTER_VIEW,
      },
      {
        label: "Trolley",
        href: "/master-data/trolley",
        icon: ShoppingCart,
        permission: PERMISSIONS.MASTER_VIEW,
      },
      {
        label: "Storage / Needle Hole",
        href: "/master-data/storage",
        icon: MapPin,
        available: false,
        permission: PERMISSIONS.MASTER_VIEW,
      },
      {
        label: "Employee",
        href: "/master-data/employee",
        icon: Users,
        permission: PERMISSIONS.MASTER_VIEW,
      },
      {
        label: "RFID Card",
        href: "/master-data/rfid",
        icon: CreditCard,
        available: false,
        permission: PERMISSIONS.MASTER_VIEW,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: "/administration/users",
        icon: Users,
        available: false,
        permission: PERMISSIONS.USER_MANAGE,
      },
      {
        // The catalogue has no role-administration code yet; `USER_MANAGE` is
        // the closest real grant and holds the place until one exists.
        label: "Roles & Permissions",
        href: "/administration/roles",
        icon: KeyRound,
        available: false,
        permission: PERMISSIONS.USER_MANAGE,
      },
      {
        label: "Devices",
        href: "/administration/devices",
        icon: Cpu,
        available: false,
        permission: PERMISSIONS.DEVICE_MANAGE,
      },
      {
        label: "Audit Log",
        href: "/administration/audit",
        icon: FileClock,
        permission: PERMISSIONS.AUDIT_VIEW,
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        available: false,
        permission: PERMISSIONS.REPORT_VIEW,
      },
    ],
  },
];
