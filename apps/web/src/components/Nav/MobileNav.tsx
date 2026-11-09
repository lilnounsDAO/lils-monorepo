import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import clsx from "clsx";
import { DESKTOP_NAV_ITEMS, GOVERNANCE_HREFS, MOBILE_NAV_ITEMS } from "./navConfig";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const GOVERNANCE_CHILDREN =
  DESKTOP_NAV_ITEMS.find((item) => item.name === "Governance")?.children ?? [];

const HIDE_NAV_PATHNAME_REGEXS = [/^\/vote\/\d+$/];

export default function MobileNav() {
  const location = useLocation();
  const pathName = location.pathname;

  const hide = false; // HIDE_NAV_PATHNAME_REGEXS.some((regex) => regex.test(pathName));
  const [governanceOpen, setGovernanceOpen] = useState(false);

  // Close the governance menu after navigating
  useEffect(() => {
    setGovernanceOpen(false);
  }, [pathName]);

  return (
    <div
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 justify-between gap-2 bg-white px-4 pb-[env(safe-area-inset-bottom)] shadow-fixed-bottom md:hidden",
        hide ? "hidden" : "flex",
      )}
    >
      {MOBILE_NAV_ITEMS.map((item, i) => {
        const isGovernance = item.name === "Governance";
        const active = pathName
          ? item.href == "/"
            ? pathName == item.href
            : isGovernance
              ? GOVERNANCE_HREFS.some((href) => pathName.startsWith(href))
              : pathName.includes(item.href)
          : false;
        const itemClassName = twMerge(
          "flex flex-1 shrink-0 grow flex-col items-center justify-center gap-1 py-2",
          active ? "text-content-primary" : "text-content-secondary",
        );
        const content = (
          <>
            <Icon
              icon={item.icon}
              size={20}
              className={clsx(
                active ? "fill-content-primary" : "fill-background-disabled",
              )}
            />
            <span className="text-[12px] font-bold leading-[16px] md:label-md">
              {item.name}
            </span>
          </>
        );

        if (isGovernance && GOVERNANCE_CHILDREN.length > 0) {
          return (
            <Popover
              key={i}
              open={governanceOpen}
              onOpenChange={setGovernanceOpen}
            >
              <PopoverTrigger className={itemClassName}>{content}</PopoverTrigger>
              <PopoverContent
                side="top"
                sideOffset={8}
                className="flex w-48 flex-col bg-white p-1"
              >
                {GOVERNANCE_CHILDREN.map((child) => (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={() => setGovernanceOpen(false)}
                    className={clsx(
                      "rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-background-secondary",
                      pathName.startsWith(child.href)
                        ? "text-content-primary"
                        : "text-content-secondary",
                    )}
                  >
                    {child.name}
                  </Link>
                ))}
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Link to={item.href} className={itemClassName} key={i}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
