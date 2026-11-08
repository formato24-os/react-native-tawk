/*
 * The HTML page that hosts the tawk.to widget. It is plain data with no React Native import, so
 * it can be tested in Node and reused by the native (WebView) and web (iframe) components.
 *
 * Every value that reaches the page goes through JSON.stringify and has "<" escaped, so a visitor
 * name like "</script><script>…" stays a string. IDs are checked against tawk.to's own format.
 */

export type TawkStatus = "online" | "away" | "offline";

export type TawkVisitor = {
  name?: string;
  email?: string;
  /** HMAC-SHA256 of the email with your tawk.to API key, computed on YOUR server (Secure Mode). */
  hash?: string;
};

export type TawkEvent =
  | { type: "ready"; status: TawkStatus }
  | { type: "status"; status: TawkStatus }
  | { type: "minimized" }
  | { type: "maximized" }
  | { type: "chatStarted" }
  | { type: "chatEnded" }
  | { type: "agentJoined"; name?: string }
  | { type: "agentMessage"; message?: string }
  | { type: "visitorMessage"; message?: string }
  | { type: "unreadCount"; count: number };

export type TawkPageOptions = {
  propertyId: string;
  widgetId: string;
  visitor?: TawkVisitor;
  /** Custom attributes shown to the agent. Keys: letters, digits and dashes. Values: up to 255 characters. */
  attributes?: Record<string, string>;
  tags?: string[];
  /** Open the chat full size as soon as it loads (default true). */
  autoOpen?: boolean;
  /** Page background behind the widget, any CSS colour (default "transparent"). */
  background?: string;
  /** The `lang` of the page, e.g. "it" or "en" (default "en"). */
  language?: string;
};

const ID = /^[a-z0-9]{1,40}$/i;
const CHIAVE = /^[a-z0-9-]{1,40}$/i;
const COLORE = /^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;

/** JSON that is safe inside a <script> element. */
const js = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`);

/** Drops what tawk.to would reject instead of letting the whole call fail. */
export function cleanAttributes(a: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) {
    const valore = String(v ?? "").trim();
    if (CHIAVE.test(k) && valore) out[k] = valore.slice(0, 255);
  }
  return out;
}

export function buildTawkPage(o: TawkPageOptions): string {
  if (!ID.test(o.propertyId) || !ID.test(o.widgetId)) throw new Error("react-native-tawk: propertyId and widgetId must be the two IDs from your tawk.to embed code");
  const sfondo = o.background && COLORE.test(o.background) ? o.background : "transparent";
  const lingua = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(o.language ?? "") ? o.language! : "en";
  const visitor: Record<string, string> = {};
  if (o.visitor?.name?.trim()) visitor.name = o.visitor.name.trim().slice(0, 100);
  if (o.visitor?.email?.trim()) visitor.email = o.visitor.email.trim().slice(0, 200);
  if (o.visitor?.hash?.trim()) visitor.hash = o.visitor.hash.trim();
  const attributi = cleanAttributes(o.attributes);
  const tag = (o.tags ?? []).map((t) => String(t).trim().slice(0, 50)).filter(Boolean).slice(0, 20);
  const apri = o.autoOpen !== false;

  return `<!doctype html><html lang="${lingua}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<style>html,body{margin:0;height:100%;background:${sfondo}}</style></head><body>
<script>
var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
${Object.keys(visitor).length ? `Tawk_API.visitor = ${js(visitor)};` : ""}
function send(m){var s=JSON.stringify(m);if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(s)}else if(window.parent!==window){window.parent.postMessage(s,'*')}}
Tawk_API.onLoad = function(){
  ${apri ? "Tawk_API.maximize();" : ""}
  ${Object.keys(attributi).length ? `Tawk_API.setAttributes(${js(attributi)}, function(){});` : ""}
  ${tag.length ? `Tawk_API.addTags(${js(tag)}, function(){});` : ""}
  send({type:'ready', status: Tawk_API.getStatus()});
};
Tawk_API.onStatusChange = function(s){ send({type:'status', status:s}); };
Tawk_API.onChatMinimized = function(){ send({type:'minimized'}); };
Tawk_API.onChatMaximized = function(){ send({type:'maximized'}); };
Tawk_API.onChatStarted = function(){ send({type:'chatStarted'}); };
Tawk_API.onChatEnded = function(){ send({type:'chatEnded'}); };
Tawk_API.onAgentJoinChat = function(d){ send({type:'agentJoined', name: d && d.name}); };
Tawk_API.onChatMessageAgent = function(m){ send({type:'agentMessage', message: m}); };
Tawk_API.onChatMessageVisitor = function(m){ send({type:'visitorMessage', message: m}); };
Tawk_API.onUnreadCountChanged = function(n){ send({type:'unreadCount', count: n}); };
</script>
<script async src="https://embed.tawk.to/${o.propertyId}/${o.widgetId}" charset="UTF-8" crossorigin="*"></script>
</body></html>`;
}

const TIPI = new Set(["ready", "status", "minimized", "maximized", "chatStarted", "chatEnded", "agentJoined", "agentMessage", "visitorMessage", "unreadCount"]);

/** Parses a message from the page; anything that is not one of ours returns null. */
export function parseTawkEvent(data: unknown): TawkEvent | null {
  if (typeof data !== "string") return null;
  try {
    const m = JSON.parse(data) as { type?: unknown };
    return m && typeof m === "object" && typeof m.type === "string" && TIPI.has(m.type) ? (m as TawkEvent) : null;
  } catch {
    return null;
  }
}
