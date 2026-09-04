"use client";

import { useEffect, useRef, useState } from "react";

interface DrawioEmbedProps {
  initialXml?: string | null;
  onXmlChange?: (xml: string) => void;
}

export function DrawioEmbed({ initialXml, onXmlChange }: DrawioEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;

      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "export" && msg.xml) {
          onXmlChange?.(msg.xml);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onXmlChange]);

  // Charger le XML initial après le montage de l'iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !initialXml) return;

    // Attendre que l'iframe soit prêt
    const checkReady = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body) {
          // Envoyer le XML à draw.io via postMessage
          iframe.contentWindow?.postMessage(
            { xml: initialXml, configure: 1 },
            "https://embed.diagrams.net",
          );
          setLoaded(true);
        } else {
          setTimeout(checkReady, 100);
        }
      } catch {
        setTimeout(checkReady, 100);
      }
    };

    // Attendre un peu pour l'initialisation
    const timer = setTimeout(checkReady, 500);
    return () => clearTimeout(timer);
  }, [initialXml]);

  return (
    <iframe
      ref={iframeRef}
      src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&configure=1&dark=0"
      className="flex-1 w-full border-0"
      title="draw.io UML Editor"
      allow="clipboard-read; clipboard-write"
    />
  );
}
