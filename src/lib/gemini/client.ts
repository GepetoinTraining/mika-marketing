// lib/gemini/client.ts

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ============================================
// EMBEDDINGS
// ============================================
export async function generateEmbedding(
    text: string,
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY' = 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: {
            taskType,
            outputDimensionality: 768,
        },
    });

    return response.embeddings![0].values!;
}

export async function generateEmbeddingsBatch(
    texts: string[],
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'
): Promise<number[][]> {
    // New SDK might not have batch - fall back to parallel
    const results = await Promise.all(
        texts.map(text => generateEmbedding(text, taskType))
    );
    return results;
}


// ============================================
// ANALYSIS (with structured output)
// ============================================
interface AnalysisResult {
    text: string;
    structured: {
        summary: string;
        findings: Array<{
            type: 'positive' | 'negative' | 'neutral';
            metric?: string;
            insight: string;
            confidence: number;
        }>;
        recommendations: Array<{
            priority: 'high' | 'medium' | 'low';
            action: string;
            rationale: string;
        }>;
        alerts: Array<{
            severity: 'info' | 'warning' | 'critical';
            message: string;
        }>;
    };
    tokensUsed: number;
}

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: '2-3 sentence executive summary' },
        findings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
                    metric: { type: Type.STRING },
                    insight: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                },
                required: ['type', 'insight', 'confidence'],
            },
        },
        recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                    action: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                },
                required: ['priority', 'action', 'rationale'],
            },
        },
        alerts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    severity: { type: Type.STRING, enum: ['info', 'warning', 'critical'] },
                    message: { type: Type.STRING },
                },
                required: ['severity', 'message'],
            },
        },
    },
    required: ['summary', 'findings', 'recommendations', 'alerts'],
};

export async function generateAnalysis(
    prompt: string,
    options: {
        depth?: 'fast' | 'deep';
    } = {}
): Promise<AnalysisResult> {
    const model = options.depth === 'deep' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
        },
    });

    const structured = JSON.parse(response.text!);
    const text = formatAnalysisAsText(structured);

    return {
        text,
        structured,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
}

function formatAnalysisAsText(structured: AnalysisResult['structured']): string {
    let text = structured.summary + '\n\n';

    if (structured.alerts.length > 0) {
        const criticals = structured.alerts.filter(a => a.severity === 'critical');
        const warnings = structured.alerts.filter(a => a.severity === 'warning');

        if (criticals.length > 0) {
            text += '🚨 ' + criticals.map(a => a.message).join('\n🚨 ') + '\n\n';
        }
        if (warnings.length > 0) {
            text += '⚠️ ' + warnings.map(a => a.message).join('\n⚠️ ') + '\n\n';
        }
    }

    if (structured.findings.length > 0) {
        text += 'Key findings:\n';
        structured.findings.forEach(f => {
            const icon = f.type === 'positive' ? '▲' : f.type === 'negative' ? '▼' : '◆';
            text += `${icon} ${f.insight}\n`;
        });
        text += '\n';
    }

    if (structured.recommendations.length > 0) {
        const highPriority = structured.recommendations.filter(r => r.priority === 'high');
        if (highPriority.length > 0) {
            text += 'Recommended actions:\n';
            highPriority.forEach(r => {
                text += `→ ${r.action}\n`;
            });
        }
    }

    return text.trim();
}


// ============================================
// COMMAND PALETTE (NL → Query)
// ============================================
interface QueryIntent {
    type: 'comparison' | 'breakdown' | 'trend' | 'anomaly' | 'search' | 'question';
    sources: string[];
    compareTo?: string[];
    metrics: string[];
    breakdowns?: string[];
    timeRange?: { type: string } | { start: string; end: string };
    naturalQuestion?: string;
}

const queryIntentSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['comparison', 'breakdown', 'trend', 'anomaly', 'search', 'question'] },
        sources: { type: Type.ARRAY, items: { type: Type.STRING } },
        compareTo: { type: Type.ARRAY, items: { type: Type.STRING } },
        metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
        breakdowns: { type: Type.ARRAY, items: { type: Type.STRING } },
        timeRange: { type: Type.OBJECT },
        naturalQuestion: { type: Type.STRING },
    },
    required: ['type', 'sources', 'metrics'],
};

export async function parseQueryIntent(
    naturalLanguage: string,
    context: {
        availableCampaigns: Array<{ id: string; name: string }>;
        availableMetrics: string[];
    }
): Promise<QueryIntent> {
    const prompt = `You are a query parser for a marketing analytics system.

Available campaigns:
${context.availableCampaigns.map(c => `- "${c.name}" (id: ${c.id})`).join('\n')}

Available metrics: ${context.availableMetrics.join(', ')}

Parse this natural language query into a structured query intent:
"${naturalLanguage}"

Match campaign names fuzzy (e.g., "black friday" matches "Black Friday 2024").
If comparing two things, use "comparison" type.
If asking about trends over time, use "trend" type.
If asking why something changed, use "anomaly" type.
If no specific campaign mentioned, use ["all_active"] as sources.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: queryIntentSchema,
        },
    });

    return JSON.parse(response.text!);
}


// ============================================
// MONITOR DIAGNOSIS
// ============================================
interface DiagnosisResult {
    likelyCause: string;
    confidence: number;
    checkList: string[];
    historicalPattern: boolean;
    recommendedActions: string[];
}

const diagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        likelyCause: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        checkList: { type: Type.ARRAY, items: { type: Type.STRING } },
        historicalPattern: { type: Type.BOOLEAN },
        recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['likelyCause', 'confidence', 'checkList', 'historicalPattern', 'recommendedActions'],
};

export async function diagnoseAnomaly(
    anomaly: {
        metric: string;
        currentValue: number;
        baselineValue: number;
        deviationPercent: number;
        scope: string;
    },
    context: {
        recentChanges?: string[];
        trafficSources?: Record<string, { before: number; after: number }>;
        similarPastIncidents?: Array<{
            diagnosis: string;
            resolution: string;
            similarity: number;
        }>;
    }
): Promise<DiagnosisResult> {
    const prompt = `You are diagnosing a marketing metric anomaly.

ANOMALY:
- Metric: ${anomaly.metric}
- Current: ${anomaly.currentValue}
- Baseline: ${anomaly.baselineValue}
- Deviation: ${anomaly.deviationPercent}%
- Scope: ${anomaly.scope}

CONTEXT:
${context.recentChanges ? `Recent changes: ${context.recentChanges.join(', ')}` : 'No recent changes logged'}

${context.trafficSources ? `Traffic source shifts:
${Object.entries(context.trafficSources).map(([source, data]) =>
        `- ${source}: ${data.before} → ${data.after} (${((data.after - data.before) / data.before * 100).toFixed(1)}%)`
    ).join('\n')}` : ''}

${context.similarPastIncidents?.length ? `SIMILAR PAST INCIDENTS:
${context.similarPastIncidents.map(i =>
        `- (${(i.similarity * 100).toFixed(0)}% similar) Cause: ${i.diagnosis}. Fixed by: ${i.resolution}`
    ).join('\n')}` : 'No similar past incidents found'}

Provide diagnosis with actionable checklist.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: diagnosisSchema,
        },
    });

    return JSON.parse(response.text!);
}


// ============================================
// HEARTBEAT SYNTHESIS
// ============================================
interface HeartbeatSection {
    name: string;
    data: any;
}

interface HeartbeatBriefing {
    headline: string;
    requiresAttention: Array<{
        item: string;
        reason: string;
        suggestedAction: string;
    }>;
    wins: string[];
    summary: string;
    sections: Array<{
        name: string;
        status: 'good' | 'warning' | 'critical';
        insight: string;
    }>;
}

const heartbeatSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: 'One line summary of the day' },
        requiresAttention: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    suggestedAction: { type: Type.STRING },
                },
                required: ['item', 'reason', 'suggestedAction'],
            },
        },
        wins: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['good', 'warning', 'critical'] },
                    insight: { type: Type.STRING },
                },
                required: ['name', 'status', 'insight'],
            },
        },
    },
    required: ['headline', 'requiresAttention', 'wins', 'summary', 'sections'],
};

export async function synthesizeHeartbeat(
    sections: HeartbeatSection[],
    options: {
        tone?: 'executive' | 'detailed' | 'casual';
        focusAreas?: string[];
    } = {}
): Promise<HeartbeatBriefing> {
    const prompt = `You are creating a daily marketing operations briefing.

DATA SECTIONS:
${sections.map(s => `
### ${s.name}
${JSON.stringify(s.data, null, 2)}
`).join('\n')}

INSTRUCTIONS:
- Tone: ${options.tone || 'executive'}
- Lead with anything requiring immediate action
- Celebrate wins (but briefly)
- Flag budget pacing issues
- Be direct, no fluff
${options.focusAreas ? `- Focus areas: ${options.focusAreas.join(', ')}` : ''}

Create a structured briefing.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Deep model for synthesis
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: heartbeatSchema,
        },
    });

    return JSON.parse(response.text!);
}


// ============================================
// STREAMING (for real-time UI)
// ============================================
export async function* generateContentStream(
    prompt: string,
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-flash'
): AsyncGenerator<string> {
    const response = await ai.models.generateContentStream({
        model,
        contents: prompt,
    });

    for await (const chunk of response) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
}