import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { landingPages } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { STYLE_PRESETS, StylePreset } from '@/lib/style-presets';

type Props = {
  params: Promise<{ id: string }>;
};

// Dynamic rendering for A/B tests
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  const [page] = await db
    .select()
    .from(landingPages)
    .where(or(eq(landingPages.slug, id), eq(landingPages.id, id)));

  if (!page) return { title: 'Not Found' };

  return {
    title: page.metaTitle || page.headline || page.name,
    description: page.metaDescription || page.subheadline || '',
  };
}

export default async function LandingPage({ params }: Props) {
  const { id } = await params;

  // Find page by slug or id
  let [page] = await db
    .select()
    .from(landingPages)
    .where(or(eq(landingPages.slug, id), eq(landingPages.id, id)));

  if (!page) {
    notFound();
    return null;
  }

  // Only serve published or testing pages
  if (page.status !== 'published' && page.status !== 'testing') {
    notFound();
    return null;
  }

  // A/B test: check for variants and randomly assign
  if (!page.isVariant) {
    const variants = await db
      .select()
      .from(landingPages)
      .where(
        and(
          eq(landingPages.parentPageId, page.id),
          eq(landingPages.isVariant, true)
        )
      );

    if (variants.length > 0) {
      // Simple traffic allocation
      // In production, use cookies for consistency
      const totalAllocation = (page.trafficAllocation || 100) +
        variants.reduce((sum, v) => sum + (v.trafficAllocation || 0), 0);

      const rand = Math.random() * totalAllocation;
      let cumulative = page.trafficAllocation || 100;

      for (const variant of variants) {
        if (rand > cumulative) {
          page = variant;
          break;
        }
        cumulative += variant.trafficAllocation || 0;
      }
    }
  }

  // Default to minimal if no style set
  const stylePreset: StylePreset = (page.stylePreset as StylePreset) || 'minimal';
  const style = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.minimal;

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