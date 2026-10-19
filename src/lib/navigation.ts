import {
  ChartUpIcon,
  DashboardSquare01Icon,
  FactoryIcon,
  File02Icon,
  KitchenUtensilsIcon,
  PackageIcon,
  Settings01Icon,
  ShoppingBag01Icon,
  UserGroupIcon,
  Book01Icon,
  ArrowMoveUpRightIcon,
  RocketIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";

// IconSvgObject is not exported by the package — derive it from a known icon.
type IconSvgObject = typeof DashboardSquare01Icon;

export type NavItem = {
  label: string;
  href: string;
  icon: IconSvgObject;
  superAdminOnly?: boolean;
  children?: Omit<NavItem, "children">[];
};

/**
 * 👑 NAVIGASI 1: PLATFORM OWNER (Baitybites ORM Engine Vendor)
 * Dikhususkan untuk pemilik software: manajemen leads, lisensi, repo generator, arsitektur.
 */
export const platformNavigation: NavItem[] = [
  { label: "Console", href: "/platform/console", icon: DashboardSquare01Icon },
  { label: "Client Inquiries", href: "/settings/leads", icon: UserGroupIcon },
  { label: "Provision Client", href: "/settings/provision", icon: RocketIcon },
  { label: "Onboarding Wizard", href: "/onboarding", icon: Book01Icon },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings01Icon,
    children: [
      { label: "Platform Settings", href: "/settings", icon: Settings01Icon },
      { label: "Migration Tool", href: "/migration", icon: ArrowMoveUpRightIcon },
      { label: "Dokumentasi", href: "/docs", icon: Book01Icon },
    ],
  },
];

/**
 * 🏪 NAVIGASI 2: STORE ADMIN (Klien Toko Baitybites Shop)
 * Dikhususkan untuk pemilik & tim toko: manajemen pesanan risol, stok produk, dapur, dan CMS.
 */
export const storeNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
  { label: "Orders", href: "/orders", icon: ShoppingBag01Icon },
  { label: "Kitchen (KDS)", href: "/kitchen", icon: KitchenUtensilsIcon },
  { label: "Products", href: "/products", icon: PackageIcon },
  { label: "Production", href: "/production", icon: FactoryIcon },
  { label: "Customers", href: "/customers", icon: UserGroupIcon },
  { label: "Reports", href: "/reports", icon: ChartUpIcon },
  {
    label: "Pengaturan Toko",
    href: "/settings",
    icon: Settings01Icon,
    children: [
      { label: "CMS Web Toko", href: "/cms", icon: File02Icon },
      { label: "Profil Toko", href: "/settings", icon: Settings01Icon },
      { label: "Panduan Penggunaan", href: "/docs", icon: Book01Icon },
    ],
  },
];

/** Default fallback (Store Admin) */
export const navigation: NavItem[] = storeNavigation;

export function getNavigationByRole(role?: string | null): NavItem[] {
  if (role === "PLATFORM_OWNER") {
    return platformNavigation;
  }
  return storeNavigation;
}
