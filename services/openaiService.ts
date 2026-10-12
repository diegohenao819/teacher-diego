import { ParagraphData, Settings, FeedbackResponse, CoherenceResponse, InputField, PageType } from '../types';
import { MOCK_FEEDBACK_RESPONSE } from '../constants';

const USE_MOCK = false;

const API_BASE = '/api';

export const checkCoherence = async (data: ParagraphData): Promise<CoherenceResponse> => {
    if (USE_MOCK) {
        console.log("Using mock coherence check. Request data:", data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { isCoherent: true, reason: "The paragraph presents a clear and logical argument from start to finish." };
    }

    const response = await fetch(`${API_BASE}/coherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to check coherence.');
    }

    return response.json();
};

export const getFeedback = async (data: ParagraphData & Settings): Promise<FeedbackResponse> => {
    if (USE_MOCK) {
        console.log("Using mock OpenAI service. Request data:", data);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return MOCK_FEEDBACK_RESPONSE;
    }

    const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to get feedback from AI. Please check your network connection.');
    }

    const parsed: FeedbackResponse = await response.json();
    if (!parsed.rubric || !parsed.rewrittenParagraph) {
        throw new Error('Invalid JSON structure received from API.');
    }

    return parsed;
};

export type SplitSections = Partial<Record<PageType, Partial<Record<InputField, string>>>>;

// Splits a pasted paragraph (one section) or a whole essay into the app's parts, verbatim.
export const splitText = async (
    request: { scope: 'paragraph'; section: PageType; text: string } | { scope: 'essay'; text: string },
): Promise<SplitSections> => {
    const response = await fetch(`${API_BASE}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.sections) {
        throw new Error(data.error || "Couldn't split your text. Check your connection and try again.");
    }
    return data.sections;
};
