"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { useTransitionStore } from "./transition";

/* Link that plays the arch curtain before navigating. Modified clicks, external
   links and same-page links behave normally. */
export default function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const go = useTransitionStore((s) => s.go);
  const pathname = usePathname();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (!href.startsWith("/") || href === pathname) return;
        e.preventDefault();
        go(href);
      }}
    />
  );
}
