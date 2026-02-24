# Hero Asset Guide

## Formal
- Video: `webm (vp9)` + `mp4 (h264)`
- Billede/poster: `avif` eller `webp` (fallback `jpg`)

## Video specs (anbefalet)
- Aspect ratio: `16:9`
- Laengde: `8-20 sek`
- Loop: ja, uden haardt cut
- Audio: fjern lydspor hvis video kun bruges muted i hero

### Oploesning
- Desktop master: `1920x1080`
- Optional mobil master: `1080x1920` (kun hvis hero-layout bliver portrait pa mobil)

### Bitrate targets
- 1080p mp4: `3-6 Mbps`
- 1080p webm: `2-5 Mbps`
- 720p fallback: `1.5-3 Mbps`

### Stoerrelse targets
- Helst `3-6 MB` per hero-video fil
- Max cirka `8 MB` per fil

## Billede/poster specs
- Aspect ratio: samme som hero (`16:9`)
- Statiske versioner:
  - `1920x1080`
  - `1280x720`
  - `960x540`
- Stoerrelse target:
  - Hero poster helst `<250 KB`
- Safe area:
  - Hold vigtigt motiv/tekst i center `60%`

## Filnavne (konvention)
- `public/media/hero-product-demo.webm`
- `public/media/hero-product-demo.mp4`
- `public/images/hero-product-demo.avif`
- `public/images/hero-product-demo.webp`

## FFmpeg presets
Forudsat inputfil: `input.mov`

### MP4 (h264, 1080p)
```bash
ffmpeg -i input.mov -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -b:v 4500k -maxrate 6000k -bufsize 9000k -movflags +faststart -an public/media/hero-product-demo.mp4
```

### WebM (vp9, 1080p)
```bash
ffmpeg -i input.mov -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libvpx-vp9 -b:v 3000k -crf 33 -deadline good -an public/media/hero-product-demo.webm
```

### Poster (AVIF)
```bash
ffmpeg -i input.mov -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -frames:v 1 -c:v libaom-av1 -still-picture 1 -crf 35 -b:v 0 public/images/hero-product-demo.avif
```

### Poster (WebP fallback)
```bash
ffmpeg -i input.mov -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -frames:v 1 -c:v libwebp -quality 78 public/images/hero-product-demo.webp
```

## Quick QA checklist
- Video starter uden hak paa mobil og desktop
- Poster vises korrekt hvis video fejler
- Hero ser ok ud med `prefers-reduced-motion`
- Ingen vigtig tekst skaeres ved small screens
- Lighthouse/LCP forvaerres ikke efter udskiftning
