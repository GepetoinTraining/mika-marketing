'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { STYLE_PRESETS, StylePreset } from '@/lib/style-presets';
import {
    generatePrompt,
    validateContent,
    generatePageHTML,
    BuilderFormData,
    GeneratedContent,
    AdPlatform,
    OptimizationGoal,
} from '@/lib/prompts';
import {
    IconArrowLeft,
    IconArrowRight,
    IconCopy,
    IconCheck,
    IconAlertTriangle,
    IconSparkles,
    IconEye,
} from '@tabler/icons-react';

type Step = 'campaign' | 'product' | 'prompt' | 'preview';

const PLATFORMS: { value: AdPlatform; label: string }[] = [
    { value: 'meta', label: 'Meta' },
    { value: 'google', label: 'Google' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'organic', label: 'Organic' },
];

const GOALS: { value: OptimizationGoal; label: string }[] = [
    { value: 'conversions', label: 'Conversions' },
    { value: 'leads', label: 'Lead Gen' },
    { value: 'traffic', label: 'Traffic' },
    { value: 'awareness', label: 'Awareness' },
];

export default function NewPageBuilder() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('campaign');
    const [copied, setCopied] = useState(false);
    const [pastedContent, setPastedContent] = useState('');
    const [validation, setValidation] = useState<ReturnType<typeof validateContent> | null>(null);

    const [form, setForm] = useState<BuilderFormData>({
        campaignName: '',
        stylePreset: 'minimal',
        platforms: ['meta'],
        optimizationGoal: 'leads',
        adsRunning: false,
        productName: '',
        productDescription: '',
        targetAudience: '',
        mainBenefit: '',
        urgencyElement: '',
        socialProof: '',
    });

    const updateForm = (updates: Partial<BuilderFormData>) => {
        setForm(prev => ({ ...prev, ...updates }));
    };

    const togglePlatform = (platform: AdPlatform) => {
        setForm(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform],
        }));
    };

    const generatedPrompt = generatePrompt(form);

    const copyPrompt = async () => {
        await navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePaste = (value: string) => {
        setPastedContent(value);
        if (value.trim()) {
            setValidation(validateContent(value));
        } else {
            setValidation(null);
        }
    };

    const canProceed = {
        campaign: form.campaignName.length >= 3,
        product: form.productName && form.productDescription && form.targetAudience && form.mainBenefit,
        prompt: validation?.valid,
        preview: true,
    };

    const steps: Step[] = ['campaign', 'product', 'prompt', 'preview'];
    const currentIndex = steps.indexOf(step);

    const goNext = () => {
        if (currentIndex < steps.length - 1 && canProceed[step]) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        } else {
            router.push('/pages');
        }
    };

    const handleSave = () => {
        // TODO: Save to database
        console.log('Saving:', { form, content: validation?.content });
        router.push('/pages');
    };

    return (
        <Shell>
            <div className="builder">
                {/* Progress */}
                <div className="progress-bar">
                    {steps.map((s, i) => (
                        <div
                            key={s}
                            className="progress-step"
                            data-active={step === s}
                            data-completed={i < currentIndex}
                        >
                            <span className="step-number">{i + 1}</span>
                            <span className="step-label">{s}</span>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="step-content">
                    {step === 'campaign' && (
                        <div className="step-panel">
                            <h2>Campaign Setup</h2>

                            <label className="field">
                                <span className="field-label">Campaign Name</span>
                                <input
                                    type="text"
                                    value={form.campaignName}
                                    onChange={e => updateForm({ campaignName: e.target.value })}
                                    placeholder="Black Friday 2025"
                                    className="input"
                                />
                            </label>

                            <div className="field">
                                <span className="field-label">Style Preset</span>
                                <div className="style-grid">
                                    {(Object.keys(STYLE_PRESETS) as StylePreset[]).map(key => {
                                        const preset = STYLE_PRESETS[key];
                                        return (
                                            <button
                                                key={key}
                                                className="style-option"
                                                data-selected={form.stylePreset === key}
                                                onClick={() => updateForm({ stylePreset: key })}
                                            >
                                                <span className="style-name">{preset.label}</span>
                                                <span className="style-desc">{preset.description}</span>
                                                <div className="style-colors">
                                                    <span style={{ background: preset.colors.background, border: '1px solid #333' }} />
                                                    <span style={{ background: preset.colors.text }} />
                                                    <span style={{ background: preset.colors.primary }} />
                                                    <span style={{ background: preset.colors.accent }} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="field">
                                <span className="field-label">Traffic Sources</span>
                                <div className="toggle-group">
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p.value}
                                            className="toggle-btn"
                                            data-selected={form.platforms.includes(p.value)}
                                            onClick={() => togglePlatform(p.value)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <span className="field-label">Optimization Goal</span>
                                <div className="toggle-group">
                                    {GOALS.map(g => (
                                        <button
                                            key={g.value}
                                            className="toggle-btn"
                                            data-selected={form.optimizationGoal === g.value}
                                            onClick={() => updateForm({ optimizationGoal: g.value })}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="field checkbox-field">
                                <input
                                    type="checkbox"
                                    checked={form.adsRunning}
                                    onChange={e => updateForm({ adsRunning: e.target.checked })}
                                />
                                <span>Ads currently running</span>
                            </label>

                            {form.adsRunning && (
                                <label className="field">
                                    <span className="field-label">Monthly Budget (R$)</span>
                                    <input
                                        type="number"
                                        value={form.budget || ''}
                                        onChange={e => updateForm({ budget: Number(e.target.value) || undefined })}
                                        placeholder="5000"
                                        className="input input-sm"
                                    />
                                </label>
                            )}
                        </div>
                    )}

                    {step === 'product' && (
                        <div className="step-panel">
                            <h2>Product Context</h2>
                            <p className="step-desc">This information shapes the AI-generated copy.</p>

                            <label className="field">
                                <span className="field-label">Product/Service Name *</span>
                                <input
                                    type="text"
                                    value={form.productName}
                                    onChange={e => updateForm({ productName: e.target.value })}
                                    placeholder="Curso de Inglês Intensivo"
                                    className="input"
                                />
                            </label>

                            <label className="field">
                                <span className="field-label">Description *</span>
                                <textarea
                                    value={form.productDescription}
                                    onChange={e => updateForm({ productDescription: e.target.value })}
                                    placeholder="6-month English course with live conversation practice, AI tutoring, and fluency guarantee..."
                                    className="input textarea"
                                    rows={3}
                                />
                            </label>

                            <label className="field">
                                <span className="field-label">Target Audience *</span>
                                <input
                                    type="text"
                                    value={form.targetAudience}
                                    onChange={e => updateForm({ targetAudience: e.target.value })}
                                    placeholder="Professionals 25-45 who need English for career growth"
                                    className="input"
                                />
                            </label>

                            <label className="field">
                                <span className="field-label">Main Benefit *</span>
                                <input
                                    type="text"
                                    value={form.mainBenefit}
                                    onChange={e => updateForm({ mainBenefit: e.target.value })}
                                    placeholder="Speak confidently in business meetings within 90 days"
                                    className="input"
                                />
                            </label>

                            <label className="field">
                                <span className="field-label">Urgency Element (optional)</span>
                                <input
                                    type="text"
                                    value={form.urgencyElement}
                                    onChange={e => updateForm({ urgencyElement: e.target.value })}
                                    placeholder="Only 20 spots available / Ends Sunday"
                                    className="input"
                                />
                            </label>

                            <label className="field">
                                <span className="field-label">Social Proof (optional)</span>
                                <input
                                    type="text"
                                    value={form.socialProof}
                                    onChange={e => updateForm({ socialProof: e.target.value })}
                                    placeholder="5,000+ students achieved fluency / 4.9 star rating"
                                    className="input"
                                />
                            </label>
                        </div>
                    )}

                    {step === 'prompt' && (
                        <div className="step-panel step-panel-wide">
                            <h2>Generate Copy</h2>
                            <p className="step-desc">
                                Copy this prompt, run it in Claude, then paste the JSON output below.
                            </p>

                            <div className="prompt-section">
                                <div className="section-header">
                                    <span>Generated Prompt</span>
                                    <button className="copy-btn" onClick={copyPrompt}>
                                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="prompt-box">{generatedPrompt}</pre>
                            </div>

                            <div className="paste-section">
                                <div className="section-header">
                                    <span>Paste AI Output</span>
                                    <IconSparkles size={16} className="sparkle" />
                                </div>
                                <textarea
                                    value={pastedContent}
                                    onChange={e => handlePaste(e.target.value)}
                                    placeholder='Paste the JSON response here...'
                                    className="paste-box"
                                    rows={10}
                                />

                                {validation && (
                                    <div className={`validation ${validation.valid ? 'valid' : 'invalid'}`}>
                                        {validation.errors.map((err, i) => (
                                            <div key={i} className="validation-error">
                                                <IconAlertTriangle size={14} /> {err}
                                            </div>
                                        ))}
                                        {validation.warnings.map((warn, i) => (
                                            <div key={i} className="validation-warning">
                                                <IconAlertTriangle size={14} /> {warn}
                                            </div>
                                        ))}
                                        {validation.valid && (
                                            <div className="validation-success">
                                                <IconCheck size={14} /> Content validated successfully
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'preview' && validation?.content && (
                        <div className="step-panel step-panel-wide">
                            <h2>Preview</h2>

                            <div className="preview-container">
                                <div className="preview-header">
                                    <span className="preview-style">{STYLE_PRESETS[form.stylePreset].label} Style</span>
                                    <button className="preview-btn">
                                        <IconEye size={14} /> Full Preview
                                    </button>
                                </div>

                                <div
                                    className="preview-frame"
                                    style={{
                                        background: STYLE_PRESETS[form.stylePreset].colors.background,
                                        color: STYLE_PRESETS[form.stylePreset].colors.text,
                                    }}
                                >
                                    <h1 style={{
                                        fontFamily: STYLE_PRESETS[form.stylePreset].typography.headingFont,
                                        fontWeight: STYLE_PRESETS[form.stylePreset].typography.headingWeight,
                                        fontSize: '2rem',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {validation.content.headline}
                                    </h1>
                                    <p style={{
                                        color: STYLE_PRESETS[form.stylePreset].colors.textMuted,
                                        marginBottom: '1.5rem',
                                    }}>
                                        {validation.content.subheadline}
                                    </p>
                                    {validation.content.bodyParagraphs.map((p, i) => (
                                        <p key={i} style={{ marginBottom: '1rem' }}>{p}</p>
                                    ))}
                                    {validation.content.bulletPoints.length > 0 && (
                                        <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                                            {validation.content.bulletPoints.map((b, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem' }}>{b}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <button style={{
                                        background: STYLE_PRESETS[form.stylePreset].colors.primary,
                                        color: STYLE_PRESETS[form.stylePreset].colors.primaryText,
                                        padding: STYLE_PRESETS[form.stylePreset].cta.padding,
                                        border: 'none',
                                        borderRadius: STYLE_PRESETS[form.stylePreset].borders.radius,
                                        fontWeight: STYLE_PRESETS[form.stylePreset].cta.fontWeight,
                                        cursor: 'pointer',
                                    }}>
                                        {validation.content.cta}
                                    </button>
                                </div>

                                <div className="meta-preview">
                                    <strong>SEO Preview</strong>
                                    <div className="meta-title">{validation.content.metaTitle}</div>
                                    <div className="meta-desc">{validation.content.metaDescription}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="nav-bar">
                    <button className="nav-btn" onClick={goBack}>
                        <IconArrowLeft size={16} />
                        {currentIndex === 0 ? 'Cancel' : 'Back'}
                    </button>

                    {step === 'preview' ? (
                        <button className="nav-btn primary" onClick={handleSave}>
                            Save Page
                        </button>
                    ) : (
                        <button
                            className="nav-btn primary"
                            onClick={goNext}
                            disabled={!canProceed[step]}
                        >
                            Continue
                            <IconArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
        .builder {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .progress-bar {
          display: flex;
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        
        .progress-step {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          font-size: 12px;
          color: var(--text-muted);
          border-right: 1px solid var(--border);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .progress-step:last-child {
          border-right: none;
        }
        
        .progress-step[data-active="true"] {
          background: rgba(0, 255, 136, 0.05);
          color: var(--accent);
        }
        
        .progress-step[data-completed="true"] {
          color: var(--text-secondary);
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid currentColor;
          font-weight: 600;
        }
        
        .step-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }
        
        .step-panel {
          max-width: 480px;
          margin: 0 auto;
        }
        
        .step-panel-wide {
          max-width: 800px;
        }
        
        .step-panel h2 {
          font-size: 20px;
          margin: 0 0 8px 0;
        }
        
        .step-desc {
          color: var(--text-secondary);
          font-size: 14px;
          margin: 0 0 24px 0;
        }
        
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .field-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }
        
        .input {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 12px;
          font-size: 14px;
          color: var(--text-primary);
          font-family: inherit;
        }
        
        .input:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .input-sm {
          max-width: 160px;
        }
        
        .textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .checkbox-field {
          flex-direction: row;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        
        .checkbox-field input {
          width: 18px;
          height: 18px;
          accent-color: var(--accent);
        }
        
        .style-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .style-option {
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .style-option:hover {
          border-color: var(--border-light);
        }
        
        .style-option[data-selected="true"] {
          border-color: var(--accent);
          background: rgba(0, 255, 136, 0.03);
        }
        
        .style-name {
          display: block;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
          color: var(--text-primary);
        }
        
        .style-desc {
          display: block;
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        
        .style-colors {
          display: flex;
          gap: 4px;
        }
        
        .style-colors span {
          width: 20px;
          height: 20px;
        }
        
        .toggle-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .toggle-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 8px 16px;
          font-size: 12px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .toggle-btn:hover {
          border-color: var(--border-light);
          color: var(--text-primary);
        }
        
        .toggle-btn[data-selected="true"] {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(0, 255, 136, 0.05);
        }
        
        .prompt-section, .paste-section {
          margin-bottom: 24px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }
        
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 6px 12px;
          font-size: 11px;
          color: var(--text-primary);
          cursor: pointer;
        }
        
        .copy-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        
        .prompt-box {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 16px;
          font-family: var(--font-mono);
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
          color: var(--text-secondary);
        }
        
        .sparkle {
          color: var(--warning);
        }
        
        .paste-box {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 16px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-primary);
          resize: vertical;
        }
        
        .paste-box:focus {
          outline: none;
          border-color: var(--accent);
        }
        
        .validation {
          margin-top: 12px;
          padding: 12px;
          font-size: 13px;
        }
        
        .validation.valid {
          background: rgba(0, 255, 136, 0.05);
          border: 1px solid var(--positive);
        }
        
        .validation.invalid {
          background: rgba(255, 68, 68, 0.05);
          border: 1px solid var(--negative);
        }
        
        .validation-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--negative);
          margin-bottom: 4px;
        }
        
        .validation-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--warning);
          margin-bottom: 4px;
        }
        
        .validation-success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--positive);
        }
        
        .preview-container {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        
        .preview-style {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .preview-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid var(--border);
          padding: 6px 12px;
          font-size: 11px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .preview-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        
        .preview-frame {
          padding: 48px 32px;
          text-align: center;
        }
        
        .meta-preview {
          padding: 16px;
          border-top: 1px solid var(--border);
          font-size: 13px;
        }
        
        .meta-preview strong {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        
        .meta-title {
          color: #1a0dab;
          margin-bottom: 4px;
        }
        
        .meta-desc {
          color: var(--text-secondary);
          font-size: 12px;
        }
        
        .nav-bar {
          display: flex;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          cursor: pointer;
        }
        
        .nav-btn:hover:not(:disabled) {
          border-color: var(--border-light);
        }
        
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .nav-btn.primary {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--bg-primary);
        }
        
        .nav-btn.primary:hover:not(:disabled) {
          background: var(--accent-dim);
        }
      `}</style>
        </Shell>
    );
}