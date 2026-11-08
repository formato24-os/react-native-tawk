import { useEffect, useMemo, useRef } from "react";
import { Linking, type StyleProp, type ViewStyle } from "react-native";
import { WebView } from "react-native-webview";
import { buildTawkPage, parseTawkEvent, type TawkEvent, type TawkPageOptions, type TawkStatus } from "./page";

export type TawkChatProps = TawkPageOptions & {
  /**
   * The origin the page pretends to live on, usually your website (e.g. "https://www.example.com/").
   * tawk.to keeps the visitor's chat history per origin, so the app and the site share it.
   */
  baseUrl: string;
  onReady?: (status: TawkStatus) => void;
  onStatusChange?: (status: TawkStatus) => void;
  /** The visitor pressed the widget's minimise button: usually the moment to close your screen. */
  onMinimize?: () => void;
  /** Every event from the widget, including messages and unread count. */
  onEvent?: (event: TawkEvent) => void;
  /** The widget did not load within `loadTimeoutMs`, or the page failed. Show a fallback (email, WhatsApp…). */
  onError?: (reason: "timeout" | "load") => void;
  /** Default 20 000 ms. */
  loadTimeoutMs?: number;
  /** Where links sent by agents open. Default: the system browser. */
  onOpenLink?: (url: string) => void;
  style?: StyleProp<ViewStyle>;
};

/** The tawk.to live chat, full screen inside a WebView, talking back to your screen. */
export function TawkChat({ baseUrl, onReady, onStatusChange, onMinimize, onEvent, onError, loadTimeoutMs = 20_000, onOpenLink, style, ...page }: TawkChatProps) {
  const html = useMemo(
    () => buildTawkPage(page),
    // The page is rebuilt only when what it contains changes, not on every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page.propertyId, page.widgetId, JSON.stringify(page.visitor), JSON.stringify(page.attributes), JSON.stringify(page.tags), page.autoOpen, page.background, page.language],
  );
  const pronto = useRef(false);
  const callbacks = useRef({ onReady, onStatusChange, onMinimize, onEvent, onError });
  callbacks.current = { onReady, onStatusChange, onMinimize, onEvent, onError };

  useEffect(() => {
    pronto.current = false;
    const t = setTimeout(() => !pronto.current && callbacks.current.onError?.("timeout"), loadTimeoutMs);
    return () => clearTimeout(t);
  }, [html, loadTimeoutMs]);

  const origine = (() => {
    try {
      return new URL(baseUrl).origin;
    } catch {
      return baseUrl;
    }
  })();
  const apriLink = onOpenLink ?? ((url: string) => void Linking.openURL(url));

  return (
    <WebView
      source={{ html, baseUrl }}
      originWhitelist={["*"]}
      domStorageEnabled
      javaScriptEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
      style={[{ flex: 1, backgroundColor: "transparent" }, style]}
      onError={() => callbacks.current.onError?.("load")}
      onMessage={(e) => {
        const ev = parseTawkEvent(e.nativeEvent.data);
        if (!ev) return;
        const cb = callbacks.current;
        if (ev.type === "ready") {
          pronto.current = true;
          cb.onReady?.(ev.status);
        }
        if (ev.type === "status") cb.onStatusChange?.(ev.status);
        if (ev.type === "minimized") cb.onMinimize?.();
        cb.onEvent?.(ev);
      }}
      onShouldStartLoadWithRequest={(r) => {
        // The widget's own frames load freely; a link an agent sends opens outside the chat.
        if (!r.isTopFrame || r.url.startsWith(origine) || r.url.startsWith("about:") || r.url.startsWith("data:")) return true;
        apriLink(r.url);
        return false;
      }}
    />
  );
}
