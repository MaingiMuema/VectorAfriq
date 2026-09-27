"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface StickySidebarProps {
  children: ReactNode;
}

const TOP_OFFSET = 80;
const BOTTOM_OFFSET = 24;

export default function StickySidebar({ children }: StickySidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(TOP_OFFSET);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const updateStickyTop = () => {
      const sidebarHeight = sidebar.offsetHeight;
      const viewportHeight = window.innerHeight;
      const fitsInViewport = sidebarHeight + TOP_OFFSET + BOTTOM_OFFSET <= viewportHeight;

      setTop(
        fitsInViewport
          ? TOP_OFFSET
          : viewportHeight - sidebarHeight - BOTTOM_OFFSET
      );
    };

    updateStickyTop();

    const resizeObserver = new ResizeObserver(updateStickyTop);
    resizeObserver.observe(sidebar);
    window.addEventListener("resize", updateStickyTop);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateStickyTop);
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className="h-fit space-y-4 lg:sticky"
      style={{ top }}
    >
      {children}
    </div>
  );
}
