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
} from "@hugeicons/core-free-icons";

// IconSvgObject is not exported by the package — derive it from a known icon.
type IconSvgObject = typeof DashboardSquare01Icon;

export type NavItem = {
  label: string;
  href: string;
  icon: IconSvgObject;
  children?: Omit<NavItem, "children">[];
};

export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: DashboardSquare01Icon },
  { label: "Orders", href: "/orders", icon: ShoppingBag01Icon },
  { label: "Customers", href: "/customers", icon: UserGroupIcon },
  { label: "Products", href: "/products", icon: PackageIcon },
  { label: "Production", href: "/production", icon: FactoryIcon },
  { label: "Kitchen", href: "/kitchen", icon: KitchenUtensilsIcon },
  { label: "Reports", href: "/reports", icon: ChartUpIcon },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings01Icon,
    children: [
      { label: "Settings", href: "/settings", icon: Settings01Icon },
      { label: "CMS", href: "/cms", icon: File02Icon },
      { label: "Docs", href: "/docs", icon: Book01Icon },
    ],
  },
];
