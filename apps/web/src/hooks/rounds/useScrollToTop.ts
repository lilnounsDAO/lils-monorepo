import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Opens a page at the top. React Router keeps the window's scroll position
 * across navigations, so following a link from halfway down a list of rounds
 * otherwise lands you halfway down the round.
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
}
