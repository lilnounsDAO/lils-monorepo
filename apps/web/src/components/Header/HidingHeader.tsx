import { useScreenSize } from "@/hooks/useScreenSize";
import clsx from "clsx";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, useMemo, useRef, useState } from "react";

const FIXED_HEADER_ROUTES = ["/explore", "/stats", "/vote"];

interface HidingHeaderProps {
  children: ReactNode;
}

export default function HidingHeader({ children }: HidingHeaderProps) {
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);
  const screenSize = useScreenSize();
  const location = useLocation();
  const pathname = location.pathname;

  const fixedHeader = useMemo(() => {
    return pathname ? FIXED_HEADER_ROUTES.some((route) => pathname.includes(route)) : false;
  }, [pathname]);

  useMotionValueEvent(scrollY, "change", (y) => {
    const difference = y - lastYRef.current;
    if (fixedHeader) {
      setIsHidden(false);
    } else {
      if (y < 100) {
        setIsHidden(false);
      } else if (Math.abs(difference) > 50) {
        setIsHidden(difference > 0);
        lastYRef.current = y;
      }
    }
  });

  return (
    <motion.header
      variants={{
        hidden: {
          y: "-100%",
        },
        visible: {
          y: 0,
        },
      }}
      transition={{ duration: 0.25, type: "spring", bounce: 0 }}
      animate={isHidden && screenSize == "sm" ? "hidden" : "visible"}
      className={clsx("sticky top-0 z-[50]")}
    >
      {children}
    </motion.header>
  );
}
