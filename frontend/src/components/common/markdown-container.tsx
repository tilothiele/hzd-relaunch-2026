
'use client'

import ReactMarkdown from 'react-markdown'
import type { ThemeDefinition } from '@/themes'

interface MarkdownContainerProps {
    content: string
    theme: ThemeDefinition
    className?: string
}

export function MarkdownContainer({ content, theme, className = "" }: MarkdownContainerProps) {
    const accentColor = theme.buttonColor || '#4560AA'
    const titleColor = theme.headlineColor || '#1a365d'
    const bodyColor = theme.textColor || '#4a5568'

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown>{content}</ReactMarkdown>

            <style jsx global>{`
                .markdown-content {
                    color: ${bodyColor};
                    line-height: 1.7;
                }
                .markdown-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 2rem auto;
                    display: block;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .markdown-content h1 { 
                    color: ${titleColor}; 
                    font-weight: 800; 
                    margin-bottom: 2rem; 
                    border-bottom: 4px solid ${accentColor}; 
                    padding-bottom: 0.5rem; 
                    font-size: 2.5rem; 
                }
                .markdown-content h2 { 
                    color: ${titleColor}; 
                    margin-top: 3.5rem; 
                    margin-bottom: 1.5rem; 
                    font-size: 1.875rem; 
                    font-weight: 700; 
                    border-left: 4px solid ${accentColor}; 
                    padding-left: 1rem;
                }
                .markdown-content h3 { 
                    color: ${titleColor}; 
                    margin-top: 2rem; 
                    font-size: 1.25rem; 
                    font-weight: 700; 
                    margin-bottom: 0.75rem; 
                    line-height: 1.5;
                }
                .markdown-content p { 
                    margin-bottom: 1.25rem; 
                    line-height: 1.5;
                }
                .markdown-content ul { 
                    list-style-type: none; 
                    padding-left: 0; 
                    margin-bottom: 1.5rem; 
                }
                .markdown-content li { 
                    position: relative; 
                    padding-left: 1.5rem; 
                    margin-bottom: 0.75rem; 
                }
                .markdown-content li::before { 
                    content: "•"; 
                    color: ${accentColor}; 
                    font-weight: bold; 
                    position: absolute; 
                    left: 0; 
                }
                .markdown-content strong { 
                    color: ${titleColor}; 
                    font-weight: 600; 
                }
                .markdown-content ol { 
                    padding-left: 1.5rem; 
                    margin-bottom: 1.5rem; 
                }
                .markdown-content ol li { 
                    list-style-type: decimal; 
                    padding-left: 0.5rem; 
                }
                .markdown-content ol li::before { 
                    content: none; 
                }

                /* FAQ specific styles if we want them here too */
                .faq-page h2 {
                    background: color-mix(in srgb, ${accentColor}, transparent 92%);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border-left: none;
                }
                .faq-page h3 {
                    position: relative;
                    padding-left: 2.5rem;
                }
                .faq-page h3::before {
                    content: "Q:";
                    color: ${accentColor};
                    position: absolute;
                    left: 0;
                    font-weight: 900;
                }
            `}</style>
        </div>
    )
}
