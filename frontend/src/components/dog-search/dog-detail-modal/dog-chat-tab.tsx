'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, TextField, IconButton, Paper, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import type { Dog } from '@/types'

interface DogChatTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

interface Message {
	id: string
	text: string
	sender: 'user' | 'bot'
	timestamp: Date
}

export function DogChatTab({ dog, strapiBaseUrl }: DogChatTabProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [inputValue, setInputValue] = useState('')
	const messagesEndRef = useRef<HTMLDivElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSend = () => {
		if (!inputValue.trim()) {
			return
		}

		const newMessage: Message = {
			id: Date.now().toString(),
			text: inputValue.trim(),
			sender: 'user',
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, newMessage])
		setInputValue('')

		// TODO: Hier wird später die AI-Logik eingefügt
		// Aktuell wird keine Antwort generiert
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
			{/* Chat Messages */}
			<Box
				sx={{
					flex: 1,
					overflowY: 'auto',
					padding: 2,
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					backgroundColor: '#f5f5f5',
				}}
			>
				{messages.length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
						}}
					>
						<Typography variant='body2' color='text.secondary'>
							Stelle eine Frage über {dog.fullKennelName ?? dog.givenName ?? 'diesen Hund'}...
						</Typography>
					</Box>
				) : (
					messages.map((message) => (
						<Box
							key={message.id}
							sx={{
								display: 'flex',
								justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
							}}
						>
							<Paper
								elevation={1}
								sx={{
									padding: 1.5,
									maxWidth: '70%',
									backgroundColor:
										message.sender === 'user' ? '#facc15' : 'white',
									color: message.sender === 'user' ? '#565757' : 'text.primary',
								}}
							>
								<Typography variant='body2'>{message.text}</Typography>
								<Typography
									variant='caption'
									sx={{
										display: 'block',
										mt: 0.5,
										opacity: 0.7,
										fontSize: '0.7rem',
									}}
								>
									{message.timestamp.toLocaleTimeString('de-DE', {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</Typography>
							</Paper>
						</Box>
					))
				)}
				<div ref={messagesEndRef} />
			</Box>

			{/* Input Area */}
			<Box
				sx={{
					padding: 2,
					borderTop: 1,
					borderColor: 'divider',
					backgroundColor: 'white',
					display: 'flex',
					gap: 1,
				}}
			>
				<TextField
					fullWidth
					multiline
					maxRows={4}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyPress={handleKeyPress}
					placeholder='Schreibe eine Nachricht...'
					variant='outlined'
					size='small'
					sx={{
						'& .MuiOutlinedInput-root': {
							backgroundColor: 'white',
						},
					}}
				/>
				<IconButton
					color='primary'
					onClick={handleSend}
					disabled={!inputValue.trim()}
					sx={{
						backgroundColor: '#facc15',
						color: '#565757',
						'&:hover': {
							backgroundColor: '#e6b800',
						},
						'&:disabled': {
							backgroundColor: '#d1d5db',
							color: '#9ca3af',
						},
					}}
				>
					<SendIcon />
				</IconButton>
			</Box>
		</Box>
	)
}


