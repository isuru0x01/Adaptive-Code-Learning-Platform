'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface CodeViewerProps {
    code?: string;
    language: string;
    isLoading: boolean;
}

export default function CodeViewer({ code, language, isLoading }: CodeViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-6 w-full bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-6 w-5/6 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-6 w-full bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-6 w-4/5 bg-gray-200 animate-pulse rounded-lg" />
            </div>
        );
    }

    if (!code) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No code snippet available</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Code header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-mono bg-blue-100 text-blue-700 rounded-lg font-semibold">
                        {language.toUpperCase()}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
            </div>

            {/* Code display */}
            <div className="flex-1 overflow-auto bg-gray-900 rounded-xl border border-gray-200 shadow-sm">
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                        background: '#1e1e1e',
                        borderRadius: '0.75rem',
                    }}
                    showLineNumbers
                    wrapLines
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
