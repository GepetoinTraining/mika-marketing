import { notFound } from 'next/navigation';
import { MOCK_PAGES } from '@/lib/mock-data';
import { STYLE_PRESETS, StylePreset } from '@/lib/style-presets';

type Props = {
  params: Promise<{ id: string }>;
};

// For static generation of known pages
export async function generateStaticParams() {
  return MOCK_PAGES.map((page) => ({ id: page.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const page = MOCK_PAGES.find(p => p.slug === id || p.id === id);

  if (!page) return { title: 'Not Found' };

  return {
    title: page.headline || page.name,
    description: page.subheadline || '',
  };
}

export default async function LandingPage({ params }: Props) {
  const { id } = await params;

  // Find page by slug or id
  let page = MOCK_PAGES.find(p => p.slug === id || p.id === id);

  if (!page) {
    notFound();
    return null; // unreachable, but TS needs this
  }

  // A/B test: check for variants and randomly assign
  // In production this would use cookies for consistency
  const variants = MOCK_PAGES.filter(p => p.parentPageId === page.id);
  if (variants.length > 0 && Math.random() > 0.5) {
    page = variants[0]; // Simple 50/50 split for now
  }

  // Default to minimal if no style set (you could add stylePreset to LandingPage type)
  const stylePreset: StylePreset = 'minimal';
  const style = STYLE_PRESETS[stylePreset];

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500&family=Poppins:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="container">
          <h1>{page.headline}</h1>
          {page.subheadline && <p className="subheadline">{page.subheadline}</p>}

          <form className="capture-form" action="/api/leads" method="POST">
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="variantId" value={page.isVariant ? page.id : ''} />
            <input
              type="email"
              name="email"
              placeholder="Seu melhor e-mail"
              required
              className="input"
            />
            <button type="submit" className="cta-button">
              {page.ctaText || 'Enviar'}
            </button>
          </form>
        </div>

        {/* Tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.mikaPageId = '${page.id}';
              window.mikaVariantId = '${page.isVariant ? page.id : ''}';
              window.mikaParentId = '${page.parentPageId || ''}';
            `,
          }}
        />

        <style>{`
          :root {
            --bg: ${style.colors.background};
            --surface: ${style.colors.surface};
            --text: ${style.colors.text};
            --text-muted: ${style.colors.textMuted};
            --primary: ${style.colors.primary};
            --primary-text: ${style.colors.primaryText};
            --accent: ${style.colors.accent};
          }

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            background: var(--bg);
            color: var(--text);
            font-family: ${style.typography.bodyFont};
            font-size: ${style.typography.bodySize};
            line-height: ${style.typography.lineHeight};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .container {
            max-width: ${style.spacing.containerMax};
            margin: 0 auto;
            padding: ${style.spacing.sectionPadding};
            text-align: center;
          }

          h1 {
            font-family: ${style.typography.headingFont};
            font-weight: ${style.typography.headingWeight};
            font-size: ${style.typography.headingSize};
            line-height: 1.1;
            margin-bottom: ${style.spacing.elementGap};
            letter-spacing: ${style.typography.letterSpacing};
          }

          .subheadline {
            font-size: ${style.typography.subheadingSize};
            color: var(--text-muted);
            margin-bottom: calc(${style.spacing.elementGap} * 1.5);
          }

          .capture-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 400px;
            margin: 0 auto;
          }

          .input {
            background: var(--surface);
            border: ${style.borders.width} solid color-mix(in srgb, var(--text) 20%, transparent);
            border-radius: ${style.borders.radius};
            padding: 16px;
            font-size: 16px;
            color: var(--text);
            font-family: inherit;
            text-align: center;
          }

          .input:focus {
            outline: none;
            border-color: var(--primary);
          }

          .input::placeholder {
            color: var(--text-muted);
          }

          .cta-button {
            display: inline-block;
            background: var(--primary);
            color: var(--primary-text);
            padding: ${style.cta.padding};
            font-size: ${style.cta.fontSize};
            font-weight: ${style.cta.fontWeight};
            font-family: ${style.typography.bodyFont};
            border: none;
            border-radius: ${style.borders.radius};
            box-shadow: ${style.cta.shadow};
            cursor: pointer;
            transition: transform 0.1s ease, opacity 0.1s ease;
            ${style.cta.uppercase ? 'text-transform: uppercase; letter-spacing: 0.1em;' : ''}
          }

          .cta-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }

          @media (max-width: 640px) {
            h1 { font-size: calc(${style.typography.headingSize} * 0.6); }
            .container { padding: 3rem 1.5rem; }
          }
        `}</style>
      </body>
    </html>
  );
}