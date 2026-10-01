# Deploy survey-web ke Vercel

Project ini **mandiri** (Vite + React). Semua request API diarahkan ke URL backend terpisah.

## Deploy ke Vercel

1. Push repo ini ke GitHub (repo terpisah, mis. `survey-web`)
2. Vercel → **Add New Project** → import repo `survey-web`
3. Framework: terdeteksi otomatis (Vite). SPA fallback (`/login`, `/admin`, dst. tidak 404 saat refresh) sudah diset via `vercel.json`.
4. Tambahkan Environment Variables (Production + Preview):

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | URL project API, mis. `https://survey-api.vercel.app` (tanpa trailing slash) |

5. Deploy.

## Verifikasi

- Buka `https://<web-url>.vercel.app/` → harus tampil halaman login
- Refresh `/login` → tetap tampil form (bukan 404)
- Login → request menuju `<VITE_API_URL>/api/auth/login`

> `VITE_API_URL` dibaca saat **build** — setelah mengubahnya, **Redeploy**.

## Dev lokal

```bash
pnpm install
pnpm dev    # http://localhost:5173, proxy /api → http://localhost:4000
```

Tanpa `VITE_API_URL`, dev memakai proxy Vite ke API lokal (jalankan `survey-api` dulu).
