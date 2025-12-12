export type StylePreset = 'brutalist' | 'minimal' | 'bold' | 'elegant';

export type StyleConfig = {
    name: StylePreset;
    label: string;
    description: string;
    colors: {
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        primary: string;
        primaryText: string;
        accent: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        headingWeight: number;
        headingSize: string;
        subheadingSize: string;
        bodySize: string;
        lineHeight: number;
        letterSpacing: string;
    };
    spacing: {
        sectionPadding: string;
        elementGap: string;
        containerMax: string;
    };
    borders: {
        radius: string;
        width: string;
        style: string;
    };
    cta: {
        padding: string;
        fontSize: string;
        fontWeight: number;
        uppercase: boolean;
        shadow: string;
    };
};

export const STYLE_PRESETS: Record<StylePreset, StyleConfig> = {
    brutalist: {
        name: 'brutalist',
        label: 'Brutalist',
        description: 'Raw, bold, unapologetic. High contrast, no decoration.',
        colors: {
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#000000',
            textMuted: '#666666',
            primary: '#000000',
            primaryText: '#ffffff',
            accent: '#ff0000',
        },
        typography: {
            headingFont: 'Arial Black, Helvetica, sans-serif',
            bodyFont: 'Arial, Helvetica, sans-serif',
            headingWeight: 900,
            headingSize: '4rem',
            subheadingSize: '1.5rem',
            bodySize: '1.125rem',
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
        },
        spacing: {
            sectionPadding: '4rem 2rem',
            elementGap: '2rem',
            containerMax: '800px',
        },
        borders: {
            radius: '0',
            width: '4px',
            style: 'solid',
        },
        cta: {
            padding: '1.25rem 2.5rem',
            fontSize: '1rem',
            fontWeight: 900,
            uppercase: true,
            shadow: 'none',
        },
    },

    minimal: {
        name: 'minimal',
        label: 'Minimal',
        description: 'Clean, spacious, focused. Let the message breathe.',
        colors: {
            background: '#fafafa',
            surface: '#ffffff',
            text: '#1a1a1a',
            textMuted: '#666666',
            primary: '#0066ff',
            primaryText: '#ffffff',
            accent: '#0066ff',
        },
        typography: {
            headingFont: 'Inter, system-ui, sans-serif',
            bodyFont: 'Inter, system-ui, sans-serif',
            headingWeight: 600,
            headingSize: '3rem',
            subheadingSize: '1.25rem',
            bodySize: '1rem',
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
        },
        spacing: {
            sectionPadding: '6rem 2rem',
            elementGap: '1.5rem',
            containerMax: '640px',
        },
        borders: {
            radius: '8px',
            width: '1px',
            style: 'solid',
        },
        cta: {
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: 500,
            uppercase: false,
            shadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
    },

    bold: {
        name: 'bold',
        label: 'Bold',
        description: 'Vibrant, energetic, attention-grabbing. Maximum impact.',
        colors: {
            background: '#1a1a2e',
            surface: '#16213e',
            text: '#ffffff',
            textMuted: '#a0a0a0',
            primary: '#ff6b00',
            primaryText: '#000000',
            accent: '#00ff88',
        },
        typography: {
            headingFont: 'Poppins, system-ui, sans-serif',
            bodyFont: 'Poppins, system-ui, sans-serif',
            headingWeight: 700,
            headingSize: '3.5rem',
            subheadingSize: '1.5rem',
            bodySize: '1.125rem',
            lineHeight: 1.5,
            letterSpacing: '0',
        },
        spacing: {
            sectionPadding: '5rem 2rem',
            elementGap: '2rem',
            containerMax: '720px',
        },
        borders: {
            radius: '16px',
            width: '2px',
            style: 'solid',
        },
        cta: {
            padding: '1.25rem 3rem',
            fontSize: '1.125rem',
            fontWeight: 700,
            uppercase: false,
            shadow: '0 4px 24px rgba(255,107,0,0.4)',
        },
    },

    elegant: {
        name: 'elegant',
        label: 'Elegant',
        description: 'Sophisticated, refined, premium. Luxury positioning.',
        colors: {
            background: '#faf9f7',
            surface: '#ffffff',
            text: '#2c3e50',
            textMuted: '#7f8c8d',
            primary: '#2c3e50',
            primaryText: '#ffffff',
            accent: '#c9a962',
        },
        typography: {
            headingFont: 'Playfair Display, Georgia, serif',
            bodyFont: 'Lato, system-ui, sans-serif',
            headingWeight: 500,
            headingSize: '3rem',
            subheadingSize: '1.25rem',
            bodySize: '1rem',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
        },
        spacing: {
            sectionPadding: '8rem 2rem',
            elementGap: '2.5rem',
            containerMax: '600px',
        },
        borders: {
            radius: '4px',
            width: '1px',
            style: 'solid',
        },
        cta: {
            padding: '1rem 2.5rem',
            fontSize: '0.875rem',
            fontWeight: 400,
            uppercase: true,
            shadow: 'none',
        },
    },
};

// Generate CSS from style config
export function generateCSS(style: StyleConfig): string {
    return `
:root {
  --bg: ${style.colors.background};
  --surface: ${style.colors.surface};
  --text: ${style.colors.text};
  --text-muted: ${style.colors.textMuted};
  --primary: ${style.colors.primary};
  --primary-text: ${style.colors.primaryText};
  --accent: ${style.colors.accent};
  
  --heading-font: ${style.typography.headingFont};
  --body-font: ${style.typography.bodyFont};
  --heading-weight: ${style.typography.headingWeight};
  --heading-size: ${style.typography.headingSize};
  --subheading-size: ${style.typography.subheadingSize};
  --body-size: ${style.typography.bodySize};
  --line-height: ${style.typography.lineHeight};
  --letter-spacing: ${style.typography.letterSpacing};
  
  --section-padding: ${style.spacing.sectionPadding};
  --element-gap: ${style.spacing.elementGap};
  --container-max: ${style.spacing.containerMax};
  
  --border-radius: ${style.borders.radius};
  --border-width: ${style.borders.width};
  
  --cta-padding: ${style.cta.padding};
  --cta-font-size: ${style.cta.fontSize};
  --cta-font-weight: ${style.cta.fontWeight};
  --cta-shadow: ${style.cta.shadow};
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--body-font);
  font-size: var(--body-size);
  line-height: var(--line-height);
  letter-spacing: var(--letter-spacing);
}

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--section-padding);
}

h1 {
  font-family: var(--heading-font);
  font-weight: var(--heading-weight);
  font-size: var(--heading-size);
  line-height: 1.1;
  margin-bottom: var(--element-gap);
}

.subheadline {
  font-size: var(--subheading-size);
  color: var(--text-muted);
  margin-bottom: var(--element-gap);
}

.body-text {
  margin-bottom: var(--element-gap);
}

.cta-button {
  display: inline-block;
  background: var(--primary);
  color: var(--primary-text);
  padding: var(--cta-padding);
  font-size: var(--cta-font-size);
  font-weight: var(--cta-font-weight);
  font-family: var(--body-font);
  border: none;
  border-radius: var(--border-radius);
  box-shadow: var(--cta-shadow);
  cursor: pointer;
  text-decoration: none;
  ${style.cta.uppercase ? 'text-transform: uppercase; letter-spacing: 0.1em;' : ''}
}

.cta-button:hover {
  opacity: 0.9;
}

ul.benefits {
  list-style: none;
  margin-bottom: var(--element-gap);
}

ul.benefits li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

ul.benefits li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--accent);
}
`.trim();
}