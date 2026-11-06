import type { KeyboardEvent } from "react";

// Makes a clickable table row or card reachable with Tab and openable with
// Enter or Space, like a link.
export const rowLinkProps = (open: () => void) => ({
  role: "link",
  tabIndex: 0,
  onClick: open,
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  },
});
