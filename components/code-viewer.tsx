'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
    code?: string;
    language: string;
    isLoading: boolean;
}

export default function CodeViewer({ code, language, isLoading }: CodeViewerProps) {
    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-6 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-6 w-5/6 bg-gray-200 animate-pulse rounded" />
                <div className="h-6 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded" />
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
            {/* Code header with language badge */}
            <div className="border-b bg-gray-50 px-6 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                    Code Snippet
                </span>
                <span className="px-3 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded-full">
                    {language}
                </span>
            </div>

            {/* Code display */}
            <div className="flex-1 overflow-auto">
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        background: 'transparent',
                    }}
                    showLineNumbers
                    wrapLines
                >
                    {code}
                </SyntaxHighlighter>
            </div>

            {/* UX Enhancement: Copy button */}
            <div className="border-t bg-gray-50 px-6 py-3">
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="text-xs text-gray-600 hover:text-gray-900 transition"
                >
                    📋 Copy code
                </button>
            </div>
        </div>
    );
}
