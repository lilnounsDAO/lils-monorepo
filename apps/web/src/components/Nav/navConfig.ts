import { IconType } from "@/components/ui/Icon";
import { isDaoVersion5 } from "@/utils/daoVersion";

export interface NavItem {
  name: string;
  icon: IconType;
  href: string;
  new?: boolean;
  children?: NavItem[];
}

export interface NavProps {
  items: NavItem[];
}

const ALL_DESKTOP_NAV_ITEMS: NavItem[] = [
  { name: "Explore", icon: "layers", href: "/explore" },
  {
    name: "Governance",
    icon: "clock",
    href: "/digest",
    children: [
      { name: "Digest", icon: "clock", href: "/digest" },
      { name: "Proposals", icon: "vote", href: "/vote" },
      { name: "Candidates", icon: "vote", href: "/candidates" },
      { name: "Topics", icon: "lightning", href: "/topics" },
    ],
  },
  { name: "Learn", icon: "book", href: "/learn" },
];

const ALL_MOBILE_NAV_ITEMS: NavItem[] = [
  { name: "Home", icon: "home", href: "/" },
  { name: "Explore", icon: "layers", href: "/explore" },
  { name: "Governance", icon: "vote", href: "/vote" },
  { name: "Learn", icon: "book", href: "/learn" },
];

function filterGovernanceChildren(item: NavItem): NavItem {
  if (!item.children) return item;
  if (isDaoVersion5()) return item;
  return {
    ...item,
    children: item.children.filter(
      (child) => child.href !== "/topics" && child.href !== "/candidates",
    ),
  };
}

export const DESKTOP_NAV_ITEMS: NavItem[] =
  ALL_DESKTOP_NAV_ITEMS.map(filterGovernanceChildren);

export const MOBILE_NAV_ITEMS: NavItem[] = ALL_MOBILE_NAV_ITEMS;

export const GOVERNANCE_HREFS = [
  "/digest",
  "/vote",
  "/candidates",
  "/topics",
];
