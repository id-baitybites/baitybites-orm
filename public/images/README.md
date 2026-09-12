# Folder Images BaityBites

Tempatkan aset gambar statis Anda di folder ini.
Dalam aplikasi Next.js, file di dalam folder `public/images/` dapat diakses langsung melalui browser dengan path:

```
/images/<nama-file>
```

### Rekomendasi Sub-folder:
- `logos/` : Logo brand utama, favicon, icon aplikasi.
- `backgrounds/` : Gambar latar belakang (hero, banner, dsb).
- `products/` : Gambar makanan, snack, menu, atau produk.
- `icons/` : SVG atau icon pendukung.

### Contoh Penggunaan di Next.js:
```tsx
import Image from "next/image";

<Image 
  src="/images/logo.png" 
  alt="BaityBites Logo" 
  width={120} 
  height={40} 
/>
```
atau via CSS:
```scss
background-image: url('/images/backgrounds/hero-bg.jpg');
```
