const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="16" fill="#0f172a" />
  <path d="M18 22h28v6H18zm0 14h20v6H18z" fill="#38bdf8" />
  <circle cx="44" cy="42" r="4" fill="#f8fafc" />
</svg>
`.trim();

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}