import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Popover state that opens on hover and closes shortly after the pointer
 * leaves both the trigger and the content. Touch devices keep click-to-toggle.
 */
export function useHoverPopover(closeDelayMs = 160) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number>();
  const canHover = useRef(false);

  useEffect(() => {
    canHover.current = window.matchMedia?.("(hover: hover)").matches ?? false;
    return () => window.clearTimeout(closeTimer.current);
  }, []);

  const onMouseEnter = useCallback(() => {
    if (!canHover.current) return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!canHover.current) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), closeDelayMs);
  }, [closeDelayMs]);

  return { open, setOpen, hoverProps: { onMouseEnter, onMouseLeave } };
}
