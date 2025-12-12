import { StylePreset, STYLE_PRESETS } from './style-presets';

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'organic';
export type OptimizationGoal = 'conversions' | 'leads' | 'traffic' | 'awareness';

export type BuilderFormData = {
    // Campaign
    campaignName: string;
    stylePreset: StylePreset;
    platforms: AdPlatform[];
    optimizationGoal: OptimizationGoal;
    adsRunning: boolean;
    budget?: number;

    // Product context
    productName: string;
    productDescription: string;
    targetAudience: string;
    mainBenefit: string;
    urgencyElement?: string;
    socialProof?: string;
};

export type GeneratedContent = {
    headline: string;
    subheadline: string;
    bodyParagraphs: string[];
    bulletPoints: string[];
    cta: string;
    metaTitle?: string;
    metaDescription?: string;
};

export type ValidationResult = {
    valid: boolean;
    errors: string[];
    warnings: string[];
    content?: GeneratedContent;
};

// Style-specific writing instructions
const STYLE_INSTRUCTIONS: Record<StylePreset, string> = {
    brutalist: `STYLE: BRUTALIST
- ALL CAPS for key emphasis (not everything)
- Short. Punchy. Sentences.
- No fluff. No corporate speak.
- Black and white framing. Binary choices.
- Make them uncomfortable, then offer relief.
- Raw honesty > polished promises`,

    minimal: `STYLE: MINIMAL
- Whisper, don't shout
- Every word earns its place
- One idea per sentence
- Sophisticated vocabulary, simple structure
- White space is your friend
- Trust the reader's intelligence`,

    bold: `STYLE: BOLD
- High energy, excitement!
- Action verbs everywhere
- Paint vivid pictures
- Create FOMO (without being sleazy)
- Emojis sparingly if appropriate
- Make them feel they're missing out`,

    elegant: `STYLE: ELEGANT
- Understated luxury
- Imply exclusivity, never beg
- Sophisticated vocabulary
- Appeal to taste, not price
- Make them feel special for considering
- Refinement over excitement`,
};

// Generate the prompt for external Opus execution
export function generatePrompt(form: BuilderFormData): string {
    const styleConfig = STYLE_PRESETS[form.stylePreset];
    const styleInstructions = STYLE_INSTRUCTIONS[form.stylePreset];

    const platformContext = form.platforms.length > 0
        ? `Traffic sources: ${form.platforms.join(', ')}`
        : '';

    const goalContext = {
        conversions: 'Primary goal: Drive immediate purchases/signups',
        leads: 'Primary goal: Capture contact information for nurturing',
        traffic: 'Primary goal: Maximize page visits and engagement',
        awareness: 'Primary goal: Build brand recognition and interest',
    }[form.optimizationGoal];

    return `You are a landing page copywriter creating content for a ${styleConfig.label} style page.

${styleInstructions}

---

PRODUCT/SERVICE: ${form.productName}
DESCRIPTION: ${form.productDescription}
TARGET AUDIENCE: ${form.targetAudience}
MAIN BENEFIT: ${form.mainBenefit}
${form.urgencyElement ? `URGENCY ELEMENT: ${form.urgencyElement}` : ''}
${form.socialProof ? `SOCIAL PROOF: ${form.socialProof}` : ''}

${platformContext}
${goalContext}

---

OUTPUT FORMAT: Respond with ONLY valid JSON, no markdown, no explanation:

{
  "headline": "Primary headline, 5-10 words max",
  "subheadline": "Supporting line, one sentence",
  "bodyParagraphs": ["First paragraph", "Second paragraph (optional)"],
  "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "cta": "Call to action button text, 2-5 words",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 155 chars"
}`;
}

// Validate and parse pasted JSON content
export function validateContent(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Clean input (remove markdown code blocks if present)
    let cleaned = input.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    // Try to parse
    let parsed: GeneratedContent;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        return {
            valid: false,
            errors: ['Invalid JSON. Make sure you copied the complete output.'],
            warnings: [],
        };
    }

    // Validate required fields
    if (!parsed.headline || typeof parsed.headline !== 'string') {
        errors.push('Missing headline');
    } else if (parsed.headline.length > 100) {
        warnings.push('Headline is long (>100 chars) - consider shortening');
    }

    if (!parsed.subheadline || typeof parsed.subheadline !== 'string') {
        errors.push('Missing subheadline');
    }

    if (!parsed.cta || typeof parsed.cta !== 'string') {
        errors.push('Missing CTA text');
    } else if (parsed.cta.length > 30) {
        warnings.push('CTA is long - shorter CTAs often perform better');
    }

    if (!Array.isArray(parsed.bodyParagraphs)) {
        errors.push('Missing bodyParagraphs array');
    }

    if (!Array.isArray(parsed.bulletPoints)) {
        warnings.push('No bullet points - consider adding benefits');
        parsed.bulletPoints = [];
    }

    // SEO checks
    if (parsed.metaTitle && parsed.metaTitle.length > 60) {
        warnings.push('Meta title exceeds 60 chars - will be truncated in search');
    }

    if (parsed.metaDescription && parsed.metaDescription.length > 155) {
        warnings.push('Meta description exceeds 155 chars');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        content: errors.length === 0 ? parsed : undefined,
    };
}

// Generate HTML for the landing page
export function generatePageHTML(
    content: GeneratedContent,
    stylePreset: StylePreset,
    formSlug: string
): string {
    const style = STYLE_PRESETS[stylePreset];

    const bulletHTML = content.bulletPoints.length > 0
        ? `<ul class="benefits">${content.bulletPoints.map(b => `<li>${b}</li>`).join('')}</ul>`
        : '';

    const bodyHTML = content.bodyParagraphs
        .map(p => `<p class="body-text">${p}</p>`)
        .join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.metaTitle || content.headline}</title>
  <meta name="description" content="${content.metaDescription || content.subheadline}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500&family=Poppins:wght@400;700&display=swap" rel="stylesheet">
  <style>
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

.body-text {
  margin-bottom: ${style.spacing.elementGap};
  text-align: left;
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
  text-decoration: none;
  ${style.cta.uppercase ? 'text-transform: uppercase; letter-spacing: 0.1em;' : ''}
  transition: transform 0.1s ease, opacity 0.1s ease;
}

.cta-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

ul.benefits {
  list-style: none;
  margin: ${style.spacing.elementGap} 0;
  text-align: left;
}

ul.benefits li {
  padding: 0.75rem 0;
  padding-left: 2rem;
  position: relative;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
}

ul.benefits li:last-child {
  border-bottom: none;
}

ul.benefits li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--accent);
  font-weight: bold;
}

@media (max-width: 640px) {
  h1 { font-size: calc(${style.typography.headingSize} * 0.6); }
  .container { padding: 3rem 1.5rem; }
}
  </style>
  <!-- Mika Tracking -->
  <script>
    window.mikaPageId = '${formSlug}';
  </script>
</head>
<body>
  <div class="container">
    <h1>${content.headline}</h1>
    <p class="subheadline">${content.subheadline}</p>
    ${bodyHTML}
    ${bulletHTML}
    <a href="#form" class="cta-button">${content.cta}</a>
  </div>
</body>
</html>`;
}