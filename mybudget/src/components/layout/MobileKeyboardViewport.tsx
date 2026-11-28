"use client";

import { useEffect } from "react";

const KEYBOARD_THRESHOLD_PX = 120;

function isTextInputElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const type = (target as HTMLInputElement).type;
  return !["checkbox", "radio", "button", "submit", "reset", "file", "range", "color"].includes(type);
}

/**
 * Syncs CSS viewport variables with `window.visualViewport` and keeps focused
 * form fields scrolled into view above the on-screen mobile keyboard.
 */
export function MobileKeyboardViewport() {
  useEffect(() => {
    const root = document.documentElement;
    let scrollTimer: number | undefined;

    function scrollFocusedIntoView() {
      const active = document.activeElement;
      if (!isTextInputElement(active)) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        active.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 150);
    }

    function syncViewport() {
      const vv = window.visualViewport;
      if (!vv) return;

      const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const keyboardOpen = window.innerHeight - vv.height > KEYBOARD_THRESHOLD_PX;

      root.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      root.style.setProperty("--vv-offset-top", `${Math.round(vv.offsetTop)}px`);
      root.style.setProperty("--keyboard-inset", `${Math.round(keyboardInset)}px`);

      if (keyboardOpen) {
        root.dataset.keyboardOpen = "true";
        scrollFocusedIntoView();
      } else {
        delete root.dataset.keyboardOpen;
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!isTextInputElement(event.target)) return;
      scrollFocusedIntoView();
    }

    syncViewport();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncViewport);
    vv?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      window.clearTimeout(scrollTimer);
      vv?.removeEventListener("resize", syncViewport);
      vv?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.removeEventListener("focusin", handleFocusIn);
      delete root.dataset.keyboardOpen;
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vv-offset-top");
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return null;
}
