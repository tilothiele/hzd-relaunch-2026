'use client'

import { useEffect, useRef } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import {
	FormatBold as FormatBoldIcon,
	FormatItalic as FormatItalicIcon,
	FormatUnderlined as FormatUnderlinedIcon,
	FormatListBulleted as FormatListBulletedIcon,
	FormatListNumbered as FormatListNumberedIcon,
} from '@mui/icons-material'

interface HtmlRichTextEditorProps {
	label: string
	value: string
	onChange: (html: string) => void
	minHeight?: number
}

export function HtmlRichTextEditor({
	label,
	value,
	onChange,
	minHeight = 160,
}: HtmlRichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null)
	const lastValueRef = useRef(value)

	useEffect(() => {
		const editor = editorRef.current
		if (!editor) return
		if (value === lastValueRef.current && editor.innerHTML) return
		if (editor.innerHTML === (value || '')) {
			lastValueRef.current = value
			return
		}
		editor.innerHTML = value || ''
		lastValueRef.current = value
	}, [value])

	const handleInput = () => {
		const editor = editorRef.current
		if (!editor) return
		const html = editor.innerHTML
		lastValueRef.current = html
		onChange(html)
	}

	const runCommand = (command: string) => {
		editorRef.current?.focus()
		document.execCommand(command, false)
		handleInput()
	}

	return (
		<Box>
			<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
				{label}
			</Typography>
			<Box
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 1,
					bgcolor: 'white',
					overflow: 'hidden',
				}}
			>
				<Box
					sx={{
						display: 'flex',
						gap: 0.5,
						px: 0.5,
						py: 0.25,
						borderBottom: '1px solid',
						borderColor: 'divider',
						bgcolor: 'grey.50',
					}}
				>
					<IconButton
						size='small'
						aria-label='Fett'
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => runCommand('bold')}
					>
						<FormatBoldIcon fontSize='small' />
					</IconButton>
					<IconButton
						size='small'
						aria-label='Kursiv'
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => runCommand('italic')}
					>
						<FormatItalicIcon fontSize='small' />
					</IconButton>
					<IconButton
						size='small'
						aria-label='Unterstrichen'
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => runCommand('underline')}
					>
						<FormatUnderlinedIcon fontSize='small' />
					</IconButton>
					<IconButton
						size='small'
						aria-label='Aufzählung'
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => runCommand('insertUnorderedList')}
					>
						<FormatListBulletedIcon fontSize='small' />
					</IconButton>
					<IconButton
						size='small'
						aria-label='Nummerierte Liste'
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => runCommand('insertOrderedList')}
					>
						<FormatListNumberedIcon fontSize='small' />
					</IconButton>
				</Box>
				<Box
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					role='textbox'
					aria-multiline='true'
					aria-label={label}
					onInput={handleInput}
					sx={{
						minHeight,
						px: 1.5,
						py: 1.25,
						outline: 'none',
						'& p': { m: 0, mb: 1 },
						'& p:last-child': { mb: 0 },
						'& ul, & ol': { pl: 3, m: 0, mb: 1 },
					}}
				/>
			</Box>
		</Box>
	)
}
