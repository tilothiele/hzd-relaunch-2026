import { MarkdownContainer } from '../common/markdown-container'
import type { ThemeDefinition } from '@/themes'

interface ChangelogViewProps {
    content: string
    theme: ThemeDefinition
}

export function ChangelogView({ content, theme }: ChangelogViewProps) {
    return (
        <div className="py-20 max-w-4xl mx-auto">
            <MarkdownContainer content={content} theme={theme} />
        </div>
    )
}
