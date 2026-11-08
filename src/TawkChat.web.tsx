import { useEffect, useMemo, useRef } from "react";
import { buildTawkPage, parseTawkEvent } from "./page";
import type { TawkChatProps } from "./TawkChat";

/** On react-native-web the same page runs in an iframe and talks back with postMessage. */
export function TawkChat({ onReady, onStatusChange, onMinimize, onEvent, onError, loadTimeoutMs = 20_000, style, baseUrl: _baseUrl, onOpenLink: _onOpenLink, ...page }: TawkChatProps) {
  const html = useMemo(
    () => buildTawkPage(page),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page.propertyId, page.widgetId, JSON.stringify(page.visitor), JSON.stringify(page.attributes), JSON.stringify(page.tags), page.autoOpen, page.background, page.language],
  );
  const frame = useRef<HTMLIFrameElement>(null);
  const callbacks = useRef({ onReady, onStatusChange, onMinimize, onEvent, onError });
  callbacks.current = { onReady, onStatusChange, onMinimize, onEvent, onError };

  useEffect(() => {
    let pronto = false;
    const ascolta = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const ev = parseTawkEvent(e.data);
      if (!ev) return;
      const cb = callbacks.current;
      if (ev.type === "ready") {
        pronto = true;
        cb.onReady?.(ev.status);
      }
      if (ev.type === "status") cb.onStatusChange?.(ev.status);
      if (ev.type === "minimized") cb.onMinimize?.();
      cb.onEvent?.(ev);
    };
    window.addEventListener("message", ascolta);
    const t = setTimeout(() => !pronto && callbacks.current.onError?.("timeout"), loadTimeoutMs);
    return () => {
      window.removeEventListener("message", ascolta);
      clearTimeout(t);
    };
  }, [html, loadTimeoutMs]);

  return <iframe ref={frame} title="Live chat" srcDoc={html} style={{ flex: 1, border: 0, width: "100%", height: "100%", ...(style as object) }} />;
}
