This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Organization server

The app runs as one Node process. It serves the Next.js pages and Socket.IO from the same origin, so the admin and viewers do not need a separate WebSocket port.

Install dependencies and build once:

```bash
npm install
npm run build
```

Start production:

```bash
npm start
```

By default the server listens on `0.0.0.0:5030`. Set a different port when required:

```bash
set PORT=5030
npm start
```

Open these URLs from the organization network:

- Admin upload and slide controls: `http://SERVER_IP:5030/admin`
- Viewer-only presentation: `http://SERVER_IP:5030/user`

The admin client is the only client authorized by the server to upload a presentation or change slides. Presentation data is held in memory and is cleared when the Node process restarts.
