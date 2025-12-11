# PassShare - Secure Password Sharing

A modern, enterprise-grade password sharing application built with security-first principles. PassShare enables secure, one-time password sharing through client-side encryption and ephemeral links that automatically self-destruct after access.

## 🔒 Security Architecture

PassShare implements a **zero-knowledge security model** where the server never has access to unencrypted passwords or encryption keys, ensuring maximum security for sensitive data transmission.

### Core Security Features

- **Client-Side AES-256-GCM Encryption**: All passwords are encrypted in the browser using the Web Crypto API before transmission
- **Zero-Knowledge Server**: Encryption keys never leave the client; server only stores encrypted ciphertext
- **One-Time Access Links**: Each share link is destroyed immediately after a single access attempt
- **Automatic Expiration**: All links expire after 24 hours using Redis TTL for guaranteed cleanup
- **Rate Limiting**: Atomic rate limiting with separate counters per endpoint and IP validation
- **CSRF Protection**: Origin validation on state-changing requests
- **Input Validation**: Size limits and format validation on all inputs
- **Secure Headers**: Comprehensive security headers including CSP, X-Frame-Options, and Referrer-Policy
- **Edge Runtime**: API routes run on Vercel's Edge Runtime for enhanced performance and security

### Encryption Process

1. **Key Generation**: 256-bit AES key generated using `crypto.getRandomValues()`
2. **IV Generation**: Unique 96-bit initialization vector for each encryption
3. **AES-256-GCM Encryption**: Password encrypted with authenticated encryption
4. **Secure Storage**: Only IV + ciphertext stored on server with 24-hour TTL
5. **Key Embedding**: Encryption key embedded in URL fragment (never sent to server)
6. **Atomic Retrieval**: One-time access enforced through atomic GETDEL operations

## 🚀 Features

### Password Generation
- **Cryptographically Secure**: Uses `crypto.getRandomValues()` with rejection sampling for unbiased randomness
- **Customizable Length**: 8-64 character passwords with flexible character sets
- **Real-Time Strength Analysis**: Visual feedback on password complexity
- **Copy to Clipboard**: One-click copying with fallback support

### Secure Sharing
- **QR Code Generation**: Easy mobile sharing with embedded encryption keys
- **Shareable URLs**: Clean, user-friendly links with security intact
- **Access Notifications**: Clear feedback when links are accessed or expired
- **Mobile Responsive**: Optimized experience across all devices

### User Experience
- **Dark/Light Mode**: System-aware theme switching with manual override
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Toast Notifications**: Real-time feedback for all user actions

## 🔧 Environment Variables

Required for production deployment:

```env
# Vercel KV Database Configuration
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

## 🏗️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run type-check
```

## 📦 Production Deployment

1. **Deploy to Vercel**: Connect your GitHub repository to Vercel
2. **Create KV Database**: Set up Vercel KV (Redis) in your project dashboard
3. **Configure Environment Variables**: Add all required KV environment variables
4. **Verify Deployment**: Test password generation and sharing functionality

## 🔍 Security Considerations

### What We Protect Against
- **Server Compromise**: Zero-knowledge architecture limits exposure
- **Man-in-the-Middle**: HTTPS and integrity verification
- **Replay Attacks**: One-time use and automatic expiration
- **Brute Force**: Rate limiting and secure key generation
- **CSRF Attacks**: Origin validation on all state-changing requests
- **Data Leaks**: No sensitive data stored in logs or databases

### Threat Model
PassShare is designed for sharing passwords between trusted parties over untrusted channels. It protects against passive surveillance and server compromise but assumes endpoint security.


## 📄 License

MIT License

Copyright (c) 2025 Ioannis E. Kosmadakis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 