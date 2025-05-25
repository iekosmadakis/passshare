# PassShare - Secure Password Sharing

A modern, secure password sharing application with client-side encryption and one-time access links.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/passshare)

## 🔧 Environment Variables

Required for production:

```env
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

## 🏗️ Local Development

```bash
npm install
npm run dev
```

## 📦 Production Build

```bash
npm run build
npm run start
```

## 🔒 Security Features

- Client-side AES-256-GCM encryption
- One-time access links
- 24-hour auto-expiry
- Rate limiting
- Zero-knowledge server

Built with Next.js 15, TypeScript, and Vercel KV. 