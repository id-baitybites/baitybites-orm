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
  Database01Icon,
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
 * NAVIGASI 1: PLATFORM OWNER (Baitybites ORM Engine Vendor)
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
      { label: "Backup & Recovery DB", href: "/settings/backup", icon: Database01Icon },
      { label: "Migration Tool", href: "/migration", icon: ArrowMoveUpRightIcon },
      { label: "Dokumentasi", href: "/docs", icon: Book01Icon },
    ],
  },
];

/**
 * NAVIGASI 2: STORE ADMIN / SUPER ADMIN (Klien Toko Baitybites Shop)
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
      { label: "Manajemen Admin & Staff", href: "/settings/admins", icon: UserGroupIcon },
      { label: "Backup & Recovery DB", href: "/settings/backup", icon: Database01Icon },
      { label: "Panduan Penggunaan", href: "/docs", icon: Book01Icon },
    ],
  },
];

/**
 * NAVIGASI 3: KASIR (Point of Sale, Pesanan Masuk, & Pelanggan)
 * Dibatasi hanya pada operasional kasir dan pencatatan pesanan.
 */
export const kasirNavigation: NavItem[] = [
  { label: "Manajemen Pesanan", href: "/orders", icon: ShoppingBag01Icon },
  { label: "Data Pelanggan", href: "/customers", icon: UserGroupIcon },
  { label: "Tracking Status Resi", href: "/tracking", icon: Store01Icon },
];

/**
 * NAVIGASI 4: KITCHEN STAFF (Kitchen Display System & Produksi)
 * Dibatasi hanya pada layar display dapur dan batching produksi.
 */
export const kitchenNavigation: NavItem[] = [
  { label: "Kitchen Display (KDS)", href: "/kitchen", icon: KitchenUtensilsIcon },
  { label: "Batch Produksi & Stok", href: "/production", icon: FactoryIcon },
];

/** Default fallback (Store Admin) */
export const navigation: NavItem[] = storeNavigation;

export function getNavigationByRole(role?: string | null): NavItem[] {
  if (role === "PLATFORM_OWNER") {
    return platformNavigation;
  }
  if (role === "KASIR") {
    return kasirNavigation;
  }
  if (role === "KITCHEN_STAFF") {
    return kitchenNavigation;
  }
  return storeNavigation;
}
