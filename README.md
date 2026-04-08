# 📹 Video CMS Pro - Arkitektur & Systemhåndbog

Dette dokument fungerer som den tekniske "Source of Truth" for Video CMS-projektet. Systemet er designet til professionel distribution af videoindhold via Mux, med særligt fokus på kravene til kommunale web-løsninger (WCAG, sikkerhed og performance).

---

## 🧠 Systemets Design-filosofi

### 1. "Clean Embed" Strategien
For at undgå konflikter med eksterne hjemmesiders CSS/JS, er `/embed/[id]` ruten totalt isoleret. Den benytter ikke det globale `layout.tsx` for at sikre, at ingen side-menuer eller admin-scripts "lækker" ind i iFramen.

### 2. Role-Based Proxy (RBAC)
Vi bruger en "Proxy"-model fremfor traditionel middleware-redirects for at understøtte de nyeste Next.js konventioner. Sikkerheden ligger i `proxy.ts`, som validerer sessionens `role` objekt før serveren overhovedet begynder at rendere siden.

### 3. Mux-First Workflow
Systemet er optimeret til Mux HLS (HTTP Live Streaming). Det betyder, at vi ikke serverer rå videofiler, men "streams", der automatisk skalerer i kvalitet baseret på brugerens båndbredde.

---

## 📁 Komplet Fil-oversigt & Ansvar

### 🏰 Kerne & Sikkerhed
| Fil | Ansvar |
| :--- | :--- |
| `proxy.ts` | **Portvagten.** Beskytter `/admin` ruterne. Validerer om brugeren er `admin` eller `contributor`. |
| `lib/auth.ts` | **Hjernen bag login.** Konfigurerer Google, Credentials og sikrer at `role` feltet fra Prisma gemmes i JWT-tokenet. |
| `types/next-auth.d.ts` | **Type-sikkerhed.** Fortæller TypeScript at `session.user` indeholder et `role` felt. |

### 🛠️ Admin Grænseflade (`/admin`)
| Fil | Ansvar |
| :--- | :--- |
| `app/admin/layout.tsx` | **Admin Rammen.** Indeholder sidebar med betinget visning (Brugere vises kun for admins). |
| `app/admin/dashboard/page.tsx` | **Projektoversigt.** Henter alle embeds via Prisma. |
| `components/admin/EmbedEditor.tsx` | **Værktøjskassen.** Håndterer drag-and-drop, Mux-upload og generering af 16:9 embed-koden. |

### 🌍 Public Player (`/embed`)
| Fil | Ansvar |
| :--- | :--- |
| `app/embed/[id]/page.tsx` | **Slutproduktet.** Den side omverdenen ser. Indeholder MuxPlayer og din custom variant-menu. |

---

## 🛠️ Det Tekniske Maskinrum (Deep Dive)

### Mux Integrationen
Vi benytter `@mux/mux-player-react`. Afspilleren kræver et `playbackId`. 
* **Flow:** Upload -> Mux behandler -> Playback ID genereres -> Gemmes i `Variant` tabellen under `muxUploadId`.



### Den "Smooth" Embed-logik
For at undgå "Layout Shift" (hvor siden hopper når videoen indlæses), genererer vi koden med et fast aspekt-forhold (Aspect Ratio):
```css
padding-top: 56.25%; /* Dette svarer præcis til 16:9 formatet */
