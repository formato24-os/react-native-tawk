# react-native-tawk

**La chat dal vivo di [tawk.to](https://www.tawk.to) per React Native ed Expo, fatta bene.**
Widget a tutto schermo, nome del visitatore e attributi già compilati, stato online ed eventi della chat restituiti all'app, link degli operatori aperti fuori dalla chat, e funziona anche sul web con react-native-web.

[🇬🇧 Read in English](README.md) · Fatto da [Formato24](https://www.formato24.com)

```bash
npx expo install react-native-tawk react-native-webview
# oppure: npm i react-native-tawk react-native-webview
```

## Uso

```tsx
import { TawkChat } from "react-native-tawk";

export default function Chat() {
  const router = useRouter();
  return (
    <TawkChat
      propertyId="6ae86b25ee2a573c33d327e9"      // dal codice di incorporamento di tawk.to
      widgetId="1k6du52tl"
      baseUrl="https://www.esempio.it/"          // il tuo sito: la cronologia della chat è condivisa
      visitor={{ name: utente.nome, email: utente.email }}
      attributes={{ piano: "pro", "versione-app": "2.4.0" }}
      tags={["app", "ios"]}
      language="it"
      background="#151515"
      onReady={(stato) => setOnline(stato === "online")}
      onStatusChange={(stato) => setOnline(stato === "online")}
      onMinimize={() => router.back()}
      onError={() => setMostraAlternativa(true)}  // es. un bottone per email o WhatsApp
    />
  );
}
```

`propertyId` e `widgetId` sono le due parti dell'indirizzo di incorporamento nella dashboard di tawk.to: `https://embed.tawk.to/<propertyId>/<widgetId>`.

## Proprietà

| Proprietà | Tipo | |
|---|---|---|
| `propertyId`, `widgetId` | `string` | **obbligatorie**, dal codice di incorporamento |
| `baseUrl` | `string` | **obbligatoria**, l'origine su cui gira la chat: usa il tuo sito, così app e sito condividono la cronologia del visitatore |
| `visitor` | `{ name?, email?, hash? }` | visitatore già compilato; `hash` serve per la Secure Mode di tawk.to e **va calcolato sul tuo server** |
| `attributes` | `Record<string, string>` | visibili all'operatore; chiavi con lettere, cifre e trattini, valori fino a 255 caratteri (quelli non validi vengono scartati) |
| `tags` | `string[]` | etichette sulla conversazione |
| `autoOpen` | `boolean` | si apre a tutto schermo appena caricata (predefinito `true`) |
| `language` | `string` | `lang` della pagina, es. `"it"` |
| `background` | `string` | colore CSS dietro il widget |
| `onReady(stato)` | | widget caricato; `stato` è `online`, `away` o `offline` |
| `onStatusChange(stato)` | | gli operatori sono passati online/assenti/offline |
| `onMinimize()` | | il visitatore ha ridotto la chat: di solito si chiude la schermata |
| `onEvent(evento)` | | ogni evento: `chatStarted`, `chatEnded`, `agentJoined`, `agentMessage`, `visitorMessage`, `unreadCount`… |
| `onError(motivo)` | | `"timeout"` (non caricata entro `loadTimeoutMs`, predefinito 20 s) o `"load"` |
| `onOpenLink(url)` | | dove si aprono i link mandati dagli operatori (predefinito: il browser di sistema) |

Sono esportate anche `buildTawkPage(opzioni)` e `parseTawkEvent(dati)`, se preferisci ospitare la pagina in una tua WebView.

## Perché questa e non una WebView qualsiasi

- **Sicura per costruzione.** Ogni valore arriva alla pagina con `JSON.stringify` e `<` neutralizzato: un nome come `</script><script>…` resta testo. ID, colori e lingua vengono verificati.
- **Eventi utili.** Chiudi la schermata quando il visitatore riduce la chat, mostra un pallino con i messaggi non letti, passa a un'alternativa quando gli operatori sono offline o il widget non si carica.
- **Cronologia condivisa.** La pagina gira sull'origine del tuo sito: chi ha iniziato a scrivere dal sito ritrova la stessa conversazione nell'app.
- **I link restano fuori dalla chat.** Un link mandato dall'operatore si apre nel browser invece di sostituire la chat.
- **Anche sul web.** Con react-native-web lo stesso componente usa un iframe e comunica con `postMessage`.

Nata dentro l'app di Formato24 per iPhone e Android.

## Licenza

[Apache 2.0](LICENSE). Se la ridistribuisci o ci costruisci qualcosa, tieni il file [NOTICE](NOTICE) con il riconoscimento a Formato24.

Non affiliata a tawk.to. «tawk.to» è un marchio del suo proprietario; il widget viene caricato da tawk.to secondo i loro termini.

---

Fatto e mantenuto da **[Formato24](https://www.formato24.com)**: siti, app e software su misura da Napoli.
