"use client";

import { useEffect, useRef } from "react";

interface DrawioEmbedProps {
  initialXml?: string | null;
  onXmlChange?: (xml: string) => void;
}

/** Protocol embed.diagrams.net : attendre `init`, puis `action: load`. */
export function DrawioEmbed({ initialXml, onXmlChange }: DrawioEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const xmlRef = useRef(initialXml);
  xmlRef.current = initialXml;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if (typeof e.data !== "string" || !e.data) return;

      try {
        const msg = JSON.parse(e.data) as {
          event?: string;
          xml?: string;
        };

        if (msg.event === "init") {
          const xml = xmlRef.current;
          iframe.contentWindow?.postMessage(
            JSON.stringify(
              xml
                ? { action: "load", xml, autosave: 1 }
                : { action: "load", autosave: 1 },
            ),
            "*",
          );
          return;
        }

        if ((msg.event === "export" || msg.event === "save" || msg.event === "autosave") && msg.xml) {
          onXmlChange?.(msg.xml);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onXmlChange]);

  // Recharger si le XML change après init (ex. conversion)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !initialXml) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ action: "load", xml: initialXml, autosave: 1 }),
      "*",
    );
  }, [initialXml]);

  return (
    <iframe
      ref={iframeRef}
      src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&libraries=1&saveAndExit=0&noSaveBtn=1&noExitBtn=1"
      className="absolute inset-0 h-full w-full border-0"
      title="draw.io UML Editor"
      allow="clipboard-read; clipboard-write"
    />
  );
}
