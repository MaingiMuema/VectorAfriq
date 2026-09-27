import React, { useEffect, useState } from "react";
import { INTER_FONT, PLAYFAIR_FONT } from "./fontBase64";

let injected = false;
const injectFonts = () => {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.textContent = `
    @font-face {
      font-family: "Inter";
      src: url(${INTER_FONT}) format("truetype");
      font-weight: 100 900;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Playfair Display";
      src: url(${PLAYFAIR_FONT}) format("truetype");
      font-weight: 100 900;
      font-style: normal;
      font-display: block;
    }
  `;
  document.head.appendChild(style);
};

export const FontsGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    injectFonts();
    if (document.fonts) {
      document.fonts.ready.then(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);
  if (!ready) return null;
  return <>{children}</>;
};
