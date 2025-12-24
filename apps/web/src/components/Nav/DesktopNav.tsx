import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { Link } from "react-router-dom";
import { DESKTOP_NAV_ITEMS } from "./navConfig";

export default function DesktopNav() {
  const location = useLocation();
  const pathName = location.pathname;

  return (
    <div className="hidden gap-2 md:flex">
      {DESKTOP_NAV_ITEMS.map((item, i) => {
        const active = pathName
          ? item.href === "/"
            ? pathName === item.href
            : pathName.includes(item.href)
          : false;
        return (
          <Link
            to={item.href}
            className={twMerge(
              "flex items-center gap-2.5 px-[12px] py-1 transition-all",
              active
                ? "text-content-primary"
                : "text-content-secondary hover:text-content-primary",
            )}
            key={i}
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
      })}
    </div>
  );
}
