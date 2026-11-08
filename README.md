# react-native-tawk

**[tawk.to](https://www.tawk.to) live chat for React Native and Expo, done properly.**
Full-screen widget, the visitor's name and custom attributes already filled in, online status and chat events back in your app, links from agents opened outside the chat, and web support through react-native-web.

[🇮🇹 Leggi in italiano](README.it.md) · Made by [Formato24](https://www.formato24.com)

```bash
npx expo install react-native-tawk react-native-webview
# or: npm i react-native-tawk react-native-webview
```

## Usage

```tsx
import { TawkChat } from "react-native-tawk";

export default function ChatScreen() {
  const router = useRouter();
  return (
    <TawkChat
      propertyId="6ae86b25ee2a573c33d327e9"      // from your tawk.to embed code
      widgetId="1k6du52tl"
      baseUrl="https://www.example.com/"         // your site: the chat history is shared with it
      visitor={{ name: user.name, email: user.email }}
      attributes={{ plan: "pro", "app-version": "2.4.0" }}
      tags={["app", "ios"]}
      language="en"
      background="#151515"
      onReady={(status) => setOnline(status === "online")}
      onStatusChange={(status) => setOnline(status === "online")}
      onMinimize={() => router.back()}
      onError={() => setShowFallback(true)}       // e.g. show an email or WhatsApp button
    />
  );
}
```

Your `propertyId` and `widgetId` are the two parts of the embed URL in the tawk.to dashboard: `https://embed.tawk.to/<propertyId>/<widgetId>`.

## Props

| Prop | Type | |
|---|---|---|
| `propertyId`, `widgetId` | `string` | **required**, from the embed code |
| `baseUrl` | `string` | **required**, the origin the chat runs on — use your website so app and site share the visitor's history |
| `visitor` | `{ name?, email?, hash? }` | prefilled visitor; `hash` is for tawk.to Secure Mode and **must be computed on your server** |
| `attributes` | `Record<string, string>` | shown to the agent; keys with letters, digits and dashes, values up to 255 characters (invalid ones are dropped, not sent) |
| `tags` | `string[]` | tags on the conversation |
| `autoOpen` | `boolean` | open full size on load (default `true`) |
| `language` | `string` | `lang` of the page, e.g. `"it"` |
| `background` | `string` | CSS colour behind the widget |
| `onReady(status)` | | widget loaded; `status` is `online`, `away` or `offline` |
| `onStatusChange(status)` | | agents went online/away/offline |
| `onMinimize()` | | the visitor pressed minimise: usually close your screen |
| `onEvent(event)` | | every event: `chatStarted`, `chatEnded`, `agentJoined`, `agentMessage`, `visitorMessage`, `unreadCount`… |
| `onError(reason)` | | `"timeout"` (not loaded within `loadTimeoutMs`, default 20 s) or `"load"` |
| `onOpenLink(url)` | | where links sent by agents open (default: the system browser) |

`buildTawkPage(options)` and `parseTawkEvent(data)` are exported too, if you prefer to host the page in your own WebView.

## Why this and not a plain WebView

- **Safe by construction.** Every value reaches the page through `JSON.stringify` with `<` escaped, so a visitor name like `</script><script>…` stays text. IDs, colours and language are validated.
- **Events you can act on.** Close the screen when the visitor minimises, show a badge from the unread count, switch to a fallback when agents are offline or the widget does not load.
- **Shared history.** The page runs on your site's origin, so a customer who started on the website finds the same conversation in the app.
- **Links stay out of the chat.** A link an agent sends opens in the browser instead of replacing the chat.
- **Web too.** On react-native-web the same component renders an iframe and talks back with `postMessage`.

Extracted from the Formato24 app for iPhone and Android.

## License

[Apache 2.0](LICENSE). If you redistribute it or build on it, keep the [NOTICE](NOTICE) file with the attribution to Formato24.

Not affiliated with tawk.to. "tawk.to" is a trademark of its owner; the widget itself is loaded from tawk.to under their terms.

---

Built and maintained by **[Formato24](https://www.formato24.com)** — websites, apps and custom software from Naples, Italy.
