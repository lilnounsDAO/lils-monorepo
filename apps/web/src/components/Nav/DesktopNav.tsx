import { useLocation, Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { DESKTOP_NAV_ITEMS, GOVERNANCE_HREFS, NavItem } from "./navConfig";
import Icon from "../ui/Icon";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { useHoverPopover } from "@/hooks/useHoverPopover";

function isActivePath(pathName: string, href: string) {
  if (href === "/") return pathName === href;
  return pathName === href || pathName.startsWith(`${href}/`);
}

function itemIsActive(pathName: string, item: NavItem) {
  if (item.children?.length) {
    return GOVERNANCE_HREFS.some((href) => isActivePath(pathName, href));
  }
  return isActivePath(pathName, item.href);
}

function NavLink({
  item,
  pathName,
  className,
}: {
  item: NavItem;
  pathName: string;
  className?: string;
}) {
  const active = isActivePath(pathName, item.href);
  return (
    <Link
      to={item.href}
      className={twMerge(
        "flex items-center gap-2.5 px-[12px] py-1 transition-all",
        active
          ? "text-content-primary"
          : "text-content-secondary hover:text-content-primary",
        className,
      )}
    >
      <span className="text-[12px] font-bold leading-[16px] md:label-md">
        {item.name}
      </span>
      {item.new && (
        <div className="rounded-full bg-semantic-accent px-2 py-1 text-white label-sm">
          New
        </div>
      )}
    </Link>
  );
}

function GovernanceMenu({
  item,
  pathName,
}: {
  item: NavItem;
  pathName: string;
}) {
  const active = itemIsActive(pathName, item);
  const children = item.children ?? [];
  const { open, setOpen, hoverProps } = useHoverPopover();

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      {/* Anchor on the whole label so the menu drops straight down from "Governance". */}
      <PopoverAnchor asChild>
        <div className="flex items-center" {...hoverProps}>
          <Link
            to={item.href}
            className={twMerge(
              "px-[12px] py-1 pr-1 transition-all",
              active
                ? "text-content-primary"
                : "text-content-secondary hover:text-content-primary",
            )}
          >
            <span className="text-[12px] font-bold leading-[16px] md:label-md">
              {item.name}
            </span>
          </Link>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open governance menu"
              className={twMerge(
                "py-1 pr-[12px] transition-all",
                active
                  ? "text-content-primary"
                  : "text-content-secondary hover:text-content-primary",
              )}
            >
              <Icon
                icon="chevronDown"
                size={14}
                className={
                  active ? "fill-content-primary" : "fill-content-secondary"
                }
              />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        alignOffset={-4}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        {...hoverProps}
        className="z-[200] w-44 max-w-none rounded-[12px] border border-gray-200 bg-white p-1 text-content-primary shadow-lg"
      >
        {children.map((child) => {
          const childActive = isActivePath(pathName, child.href);
          return (
            <Link
              key={child.href}
              to={child.href}
              onClick={() => setOpen(false)}
              className={twMerge(
                "flex rounded-[8px] px-3 py-2 text-sm transition-colors",
                childActive
                  ? "bg-background-secondary font-medium text-content-primary"
                  : "text-content-secondary hover:bg-background-ternary hover:text-content-primary",
              )}
            >
              {child.name}
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export default function DesktopNav() {
  const location = useLocation();
  const pathName = location.pathname;

  return (
    <div className="hidden gap-2 md:flex">
      {DESKTOP_NAV_ITEMS.map((item) =>
        item.children?.length ? (
          <GovernanceMenu key={item.href} item={item} pathName={pathName} />
        ) : (
          <NavLink key={item.href} item={item} pathName={pathName} />
        ),
      )}
    </div>
  );
}
