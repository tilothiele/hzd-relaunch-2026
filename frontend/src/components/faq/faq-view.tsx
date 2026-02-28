import { MarkdownContainer } from '../common/markdown-container'
import type { ThemeDefinition } from '@/themes'

interface FaqViewProps {
    content: string
    theme: ThemeDefinition
}

export function FaqView({ content, theme }: FaqViewProps) {
    return (
        <div className="py-20 max-w-4xl mx-auto faq-page">
            <MarkdownContainer content={content} theme={theme} />
        </div>
    )
}
