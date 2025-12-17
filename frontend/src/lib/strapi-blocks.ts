// Strapi Blocks Format Types
export interface StrapiBlock {
	type: string
	children?: StrapiBlock[]
	text?: string
	bold?: boolean
	italic?: boolean
	underline?: boolean
	code?: boolean
	url?: string
}

/**
 * Konvertiert Strapi Blocks JSON zu HTML
 */
export function renderStrapiBlocks(blocks: unknown): string {
	if (!blocks) {
		return ''
	}

	// Wenn es bereits ein String ist, zurückgeben
	if (typeof blocks === 'string') {
		return blocks
	}

	// Wenn es ein Array ist, verarbeite es als Blocks
	if (Array.isArray(blocks)) {
		return blocks.map((block) => renderBlock(block)).join('')
	}

	// Wenn es ein Objekt ist, versuche es als Block zu behandeln
	if (typeof blocks === 'object' && blocks !== null) {
		return renderBlock(blocks as StrapiBlock)
	}

	return ''
}

function renderBlock(block: StrapiBlock): string {
	if (!block || typeof block !== 'object') {
		return ''
	}

	const { type, children, text, bold, italic, underline, code, url } = block

	// Text-Node
	if (type === 'text' || text !== undefined) {
		let content = text || ''
		if (bold) content = `<strong>${content}</strong>`
		if (italic) content = `<em>${content}</em>`
		if (underline) content = `<u>${content}</u>`
		if (code) content = `<code>${content}</code>`
		return content
	}

	// Link
	if (type === 'link' && url) {
		const linkContent = children ? children.map(renderBlock).join('') : ''
		return `<a href="${url}">${linkContent}</a>`
	}

	// Paragraph
	if (type === 'paragraph') {
		const content = children ? children.map(renderBlock).join('') : ''
		return `<p>${content}</p>`
	}

	// Heading
	if (type === 'heading') {
		const level = (block as { level?: number }).level || 1
		const content = children ? children.map(renderBlock).join('') : ''
		return `<h${level}>${content}</h${level}>`
	}

	// List
	if (type === 'list') {
		const listType = (block as { format?: string }).format === 'ordered' ? 'ol' : 'ul'
		const content = children ? children.map((child) => `<li>${renderBlock(child)}</li>`).join('') : ''
		return `<${listType}>${content}</${listType}>`
	}

	// List Item
	if (type === 'list-item') {
		const content = children ? children.map(renderBlock).join('') : ''
		return content
	}

	// Quote
	if (type === 'quote') {
		const content = children ? children.map(renderBlock).join('') : ''
		return `<blockquote>${content}</blockquote>`
	}

	// Code
	if (type === 'code') {
		const content = children ? children.map(renderBlock).join('') : ''
		return `<pre><code>${content}</code></pre>`
	}

	// Generic: Rendere Children falls vorhanden
	if (children && Array.isArray(children)) {
		return children.map(renderBlock).join('')
	}

	return ''
}






