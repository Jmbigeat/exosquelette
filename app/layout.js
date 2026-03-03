export const metadata = {
  title: "ABNEG@TION - Forge Carrière",
  description: "Extrais tes preuves. Mesure ta rareté. Arme-toi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{margin: 0, padding: 0, background: "#0a0a1a", color: "#ccd6f6", fontFamily: "Inter, -apple-system, sans-serif"}}>{children}</body>
    </html>
  );
}
