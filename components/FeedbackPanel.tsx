import React from 'react';
// FIX: Import `InputField` to correctly type the `fieldOrder` prop.
import { FeedbackResponse, ParagraphData, InputField } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import LoaderIcon from './icons/LoaderIcon';
import CopyIcon from './icons/CopyIcon';

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const getBadgeStyle = () => {
        if (score >= 4.25) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        if (score >= 3.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    };
    const getBadgeText = () => {
        if (score >= 4.25) return 'Excellent';
        if (score >= 3.5) return 'Proficient';
        return 'Needs Revision';
    };
    return (
        <span className={`px-2 py-1 text-sm font-medium rounded-full ${getBadgeStyle()}`}>
            {getBadgeText()}
        </span>
    );
};

const RubricTable: React.FC<{ rubric: FeedbackResponse['rubric'] }> = ({ rubric }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                    <th className="p-3 font-semibold text-sm">Criterion</th>
                    <th className="p-3 font-semibold text-sm text-center">Score</th>
                    <th className="p-3 font-semibold text-sm">Rationale</th>
                </tr>
            </thead>
            <tbody>
                {rubric.map((item, index) => (
                    <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="p-3 font-medium">{item.criterion}</td>
                        <td className="p-3 text-center text-lg font-bold text-brand-primary dark:text-indigo-400">{item.score}/5</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{item.rationale}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const GrammarAnalysisTable: React.FC<{ analysis: FeedbackResponse['grammarAnalysis'] }> = ({ analysis }) => {
    if (!analysis || analysis.length === 0) {
        return (
            <p className="text-slate-600 dark:text-slate-400">No specific grammatical errors were detected. Great job!</p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        <th className="p-3 font-semibold text-sm">Grammatical Error</th>
                        <th className="p-3 font-semibold text-sm">Correction</th>
                        <th className="p-3 font-semibold text-sm">Explanation</th>
                    </tr>
                </thead>
                <tbody>
                    {analysis.map((item, index) => (
                        <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                            <td className="p-3 text-red-500 dark:text-red-400 font-mono text-sm">
                                <del>{item.error}</del>
                            </td>
                            <td className="p-3 text-green-600 dark:text-green-400 font-mono text-sm">
                                {item.correction}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{item.explanation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const FeedbackContent: React.FC<{ feedback: FeedbackResponse, onApplyEdits: () => void }> = ({ feedback, onApplyEdits }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(feedback.rewrittenParagraph);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalScore = feedback.rubric.reduce((sum, item) => sum + item.score, 0);
    const maxScore = feedback.rubric.length * 5;
    const scaledScore = maxScore > 0 ? (totalScore / maxScore) * 5.0 : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Overall Score: {scaledScore.toFixed(1)}/5.0</h3>
                        <ScoreBadge score={scaledScore} />
                    </div>
                    <RubricTable rubric={feedback.rubric} />
                </div>
            </Card>

            {feedback.grammarAnalysis && feedback.grammarAnalysis.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-xl font-bold mb-4">Grammar Analysis</h3>
                        <GrammarAnalysisTable analysis={feedback.grammarAnalysis} />
                    </div>
                </Card>
            )}

            <Card>
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4">Actionable Suggestions</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                        {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                    {Object.keys(feedback.inlineEdits).length > 0 && (
                       <Button onClick={onApplyEdits} className="mt-4">Apply All Edits</Button>
                    )}
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Revised Paragraph</h3>
                        <Button variant="ghost" size="sm" onClick={handleCopy}>
                            <CopyIcon className="w-4 h-4 mr-2" />
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                        {feedback.rewrittenParagraph}
                    </p>
                </div>
            </Card>
        </div>
    );
};

interface FeedbackPanelProps {
    inputs: ParagraphData;
    feedback: FeedbackResponse | null;
    isLoading: boolean;
    error: string | null;
    onApplyEdits: () => void;
    // FIX: Changed `(keyof ParagraphData)[]` to `InputField[]` to correctly handle all possible fields
    // from both Body and Counter-Argument paragraphs. This resolves the type error from App.tsx.
    fieldOrder: InputField[];
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ inputs, feedback, isLoading, error, onApplyEdits, fieldOrder }) => {
    const hasContent = Object.values(inputs).some(val => typeof val === 'string' && val.trim() !== '');

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <LoaderIcon className="w-12 h-12 text-brand-primary animate-spin-slow mb-4" />
                    <h3 className="text-xl font-semibold">Analyzing your paragraph...</h3>
                    <p className="text-slate-500">The AI is warming up. This may take a moment.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-red-600 dark:text-red-400">
                    <h3 className="text-xl font-semibold">Oops! Something went wrong.</h3>
                    <p>{error}</p>
                </div>
            );
        }

        if (feedback) {
            return <FeedbackContent feedback={feedback} onApplyEdits={onApplyEdits} />;
        }
        
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                 <div className="max-w-md">
                     <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                         Your Feedback Appears Here
                     </h3>
                     <p className="text-slate-500 mb-6">
                         Complete the form on the left and click "Get Feedback" to see your AI-powered analysis.
                     </p>
                 </div>
             </div>
        );
    };

    return (
        <div className="relative">
            <div className="sticky top-20">
                {hasContent && !feedback && !isLoading && (
                    <Card className="mb-6 animate-fade-in">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">Live Preview</h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none p-4 bg-slate-50 dark:bg-slate-800 rounded-md space-y-4">
                               {fieldOrder.map(field => {
                                   // FIX: Use indexed access with a type assertion to safely access properties
                                   // on the `ParagraphData` union type.
                                   const text = (inputs as Record<InputField, string>)[field];
                                   return text && <p key={field}>{text}</p>;
                               })}
                            </div>
                        </div>
                    </Card>
                )}
                {renderContent()}
            </div>
        </div>
    );
};

export default FeedbackPanel;