'use client'

import React, { useState } from 'react'
import {
	Box,
	Menu,
	MenuItem,
	Button,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Collapse,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import Link from 'next/link'
import type { MenuItem as MenuItemType } from '@/types'

interface NavigationMenuProps {
	menuItems: MenuItemType[]
	theme: {
		textColor: string
		headerFooterTextColor: string
	}
}

function DesktopMenuItem({
	item,
	theme,
}: {
	item: MenuItemType
	theme: { textColor: string; headerFooterTextColor: string }
}) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const open = Boolean(anchorEl)
	const hasChildren = Boolean(item.children?.length)
	const itemKey = item.url ?? item.name

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	if (hasChildren) {
		return (
			<>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 0.5,
					}}
				>
					{item.url ? (
						<Button
							component={Link}
							href={item.url}
							sx={{
								color: theme.headerFooterTextColor,
								fontSize: '1.25rem',
								fontWeight: 600,
								textTransform: 'none',
								paddingRight: 0.5,
								'&:hover': {
									fontWeight: 700,
									backgroundColor: 'transparent',
								},
							}}
						>
							{item.name}
						</Button>
					) : (
						<Typography
							variant='body1'
							sx={{
								color: theme.headerFooterTextColor,
								fontSize: '1.25rem',
								fontWeight: 600,
								paddingLeft: '16px',
							}}
						>
							{item.name}
						</Typography>
					)}
					<IconButton
						onClick={handleClick}
						size='small'
						aria-label={`${item.name} Untermenü ${open ? 'schließen' : 'öffnen'}`}
						sx={{
							color: theme.headerFooterTextColor,
							padding: '4px',
							'&:hover': {
								fontWeight: 700
							},
						}}
					>
						<ExpandMoreIcon
							sx={{
								transition: 'transform 0.2s',
								transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
							}}
						/>
					</IconButton>
				</Box>
				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'left',
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'left',
					}}
					sx={{
						'& .MuiPaper-root': {
							backgroundColor: 'var(--color-white)',
							color: 'var(--color-text)',
							mt: 1,
							padding: 2,
							borderRadius: 2,
							border: '1px solid rgba(0, 0, 0, 0.08)',
							minWidth: 200,
						},
					}}
				>
					{item.children?.map((child) => {
						const childKey = child.url ?? child.name
						const hasGrandchildren = Boolean(child.children?.length)

						if (hasGrandchildren) {
							return (
								<Box key={childKey} sx={{ mb: 2 }}>
									{child.url ? (
										<MenuItem
											component={Link}
											href={child.url}
											onClick={handleClose}
											sx={{
												fontSize: '1.125rem',
												fontWeight: 600,
												padding: '8px 16px',
												color: 'var(--color-text)',
												'&:hover': {
													fontWeight: 700,
												},
											}}
										>
											{child.name}
										</MenuItem>
									) : (
										<Typography
											variant='body1'
											sx={{
												fontSize: '1.125rem',
												fontWeight: 600,
												padding: '8px 16px',
												color: 'var(--color-text)',
											}}
										>
											{child.name}
										</Typography>
									)}
									{child.children?.map((grandchild) => {
										const grandchildKey = grandchild.url ?? grandchild.name
										const hasGreatGrandchildren = Boolean(grandchild.children?.length)

										if (hasGreatGrandchildren) {
											return (
												<React.Fragment key={grandchildKey}>
													{grandchild.url ? (
														<MenuItem
															component={Link}
															href={grandchild.url}
															onClick={handleClose}
															sx={{
																padding: '6px 12px',
																color: 'var(--color-text)',
																fontWeight: 600,
																'&:hover': {
																	fontWeight: 700,
																},
															}}
														>
															{grandchild.name}
														</MenuItem>
													) : (
														<MenuItem
															disabled
															sx={{
																padding: '6px 12px',
																color: 'var(--color-text)',
																fontWeight: 600,
																opacity: 1,
																cursor: 'default',
																'&.Mui-disabled': {
																	opacity: 1,
																},
															}}
														>
															<Typography
																variant='body2'
																sx={{
																	fontSize: '1rem',
																	fontWeight: 600,
																	color: 'var(--color-text)',
																}}
															>
																{grandchild.name}
															</Typography>
														</MenuItem>
													)}
													{grandchild.children?.map((greatGrandchild) => {
														const greatGrandchildKey = greatGrandchild.url ?? greatGrandchild.name
														return (
															<MenuItem
																key={greatGrandchildKey}
																component={Link}
																href={greatGrandchild.url ?? '#'}
																onClick={handleClose}
																sx={{
																	paddingLeft: 6,
																	color: 'var(--color-text)',
																	'&:hover': {
																		fontWeight: 700,
																	},
																}}
															>
																{greatGrandchild.name}
															</MenuItem>
														)
													})}
												</React.Fragment>
											)
										}

										return (
											<MenuItem
												key={grandchildKey}
												component={Link}
												href={grandchild.url ?? '#'}
												onClick={handleClose}
												sx={{
													paddingLeft: 4,
													color: 'var(--color-text)',
													'&:hover': {
														fontWeight: 700,
													},
												}}
											>
												{grandchild.name}
											</MenuItem>
										)
									})}
								</Box>
							)
						}

						return (
							<MenuItem
								key={childKey}
								component={Link}
								href={child.url ?? '#'}
								onClick={handleClose}
								sx={{
									color: '#565757',
									'&:hover': {
										fontWeight: 700,
									},
								}}
							>
								{child.name}
							</MenuItem>
						)
					})}
				</Menu>
			</>
		)
	}

	if (item.url) {
		return (
			<Button
				component={Link}
				href={item.url}
				sx={{
					color: theme.headerFooterTextColor,
					fontSize: '1.25rem',
					fontWeight: 600,
					textTransform: 'none',
					'&:hover': {
						fontWeight: 700,
					},
				}}
			>
				{item.name}
			</Button>
		)
	}

	return (
		<Typography
			variant='body1'
			sx={{
				color: theme.headerFooterTextColor,
				fontSize: '1.25rem',
				fontWeight: 600,
				padding: '6px 16px',
			}}
		>
			{item.name}
		</Typography>
	)
}

export function NavigationMenu({ menuItems, theme }: NavigationMenuProps) {
	const muiTheme = useTheme()
	const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))
	const [mobileOpen, setMobileOpen] = useState(false)
	const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

	const handleMobileToggle = () => {
		setMobileOpen(!mobileOpen)
	}

	const handleSubmenuToggle = (itemKey: string) => {
		setOpenSubmenus((prev) => ({
			...prev,
			[itemKey]: !prev[itemKey],
		}))
	}

	if (isMobile) {
		return (
			<>
				<IconButton
					onClick={handleMobileToggle}
					sx={{
						color: theme.headerFooterTextColor,
					}}
					aria-label='Menü öffnen'
				>
					<MenuIcon />
				</IconButton>
				<Drawer
					anchor='right'
					open={mobileOpen}
					onClose={handleMobileToggle}
					sx={{
						'& .MuiDrawer-paper': {
							width: 280,
							backgroundColor: '#F2F5F7',
						},
					}}
				>
					<Box
						sx={{
							width: 280,
							padding: 2,
						}}
					>
						<List>
							{menuItems.map((item) => {
								const hasChildren = Boolean(item.children?.length)
								const itemKey = item.url ?? item.name
								const isSubmenuOpen = openSubmenus[itemKey]

								return (
									<Box key={itemKey}>
										{hasChildren ? (
											<>
												<ListItem disablePadding>
													{item.url ? (
														<ListItemButton
															component={Link}
															href={item.url}
															onClick={() => handleSubmenuToggle(itemKey)}
															sx={{
																color: 'var(--color-text)',
																'&:hover': {
																	backgroundColor: 'rgba(0, 0, 0, 0.04)',
																},
															}}
														>
															<ListItemText
																primary={
																	<Typography
																		variant='body1'
																		sx={{
																			fontSize: '1.125rem',
																			fontWeight: 500,
																		}}
																	>
																		{item.name}
																	</Typography>
																}
															/>
															{isSubmenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
														</ListItemButton>
													) : (
														<ListItemButton
															onClick={() => handleSubmenuToggle(itemKey)}
															sx={{
																color: 'var(--color-text)',
																'&:hover': {
																	backgroundColor: 'rgba(0, 0, 0, 0.04)',
																},
															}}
														>
															<ListItemText
																primary={
																	<Typography
																		variant='body1'
																		sx={{
																			fontSize: '1.125rem',
																			fontWeight: 500,
																		}}
																	>
																		{item.name}
																	</Typography>
																}
															/>
															{isSubmenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
														</ListItemButton>
													)}
												</ListItem>
												<Collapse in={isSubmenuOpen} timeout='auto' unmountOnExit>
													<List component='div' disablePadding>
														{item.children?.map((child) => {
															const childKey = child.url ?? child.name
															const hasGrandchildren = Boolean(child.children?.length)

															if (hasGrandchildren) {
																return (
																	<Box key={childKey}>
																		<ListItem disablePadding>
																			{child.url ? (
																				<ListItemButton
																					component={Link}
																					href={child.url}
																					onClick={handleMobileToggle}
																					sx={{
																						pl: 4,
																						color: 'var(--color-text)',
																						'&:hover': {
																							backgroundColor: 'rgba(0, 0, 0, 0.04)',
																						},
																					}}
																				>
																					<ListItemText
																						primary={
																							<Typography
																								variant='body2'
																								sx={{
																									fontSize: '1rem',
																									fontWeight: 600,
																								}}
																							>
																								{child.name}
																							</Typography>
																						}
																					/>
																				</ListItemButton>
																			) : (
																				<ListItemButton
																					sx={{
																						pl: 4,
																						color: 'var(--color-text)',
																						'&:hover': {
																							backgroundColor: 'rgba(0, 0, 0, 0.04)',
																						},
																					}}
																				>
																					<ListItemText
																						primary={
																							<Typography
																								variant='body2'
																								sx={{
																									fontSize: '1rem',
																									fontWeight: 600,
																								}}
																							>
																								{child.name}
																							</Typography>
																						}
																					/>
																				</ListItemButton>
																			)}
																		</ListItem>
																		{child.children?.map((grandchild) => {
																			const grandchildKey = grandchild.url ?? grandchild.name
																			const hasGreatGrandchildren = Boolean(grandchild.children?.length)

																			if (hasGreatGrandchildren) {
																				return (
																					<Box key={grandchildKey}>
																						<ListItem disablePadding>
																							{grandchild.url ? (
																								<ListItemButton
																									component={Link}
																									href={grandchild.url}
																									onClick={handleMobileToggle}
																									sx={{
																										pl: 6,
																										color: 'var(--color-text)',
																										'&:hover': {
																											backgroundColor: 'rgba(0, 0, 0, 0.04)',
																										},
																									}}
																								>
																									<ListItemText
																										primary={
																											<Typography
																												variant='body2'
																												sx={{
																													fontSize: '0.9rem',
																													fontWeight: 600,
																												}}
																											>
																												{grandchild.name}
																											</Typography>
																										}
																									/>
																								</ListItemButton>
																							) : (
																								<ListItemButton
																									sx={{
																										pl: 6,
																										color: 'var(--color-text)',
																										'&:hover': {
																											backgroundColor: 'rgba(0, 0, 0, 0.04)',
																										},
																									}}
																								>
																									<ListItemText
																										primary={
																											<Typography
																												variant='body2'
																												sx={{
																													fontSize: '0.9rem',
																													fontWeight: 600,
																												}}
																											>
																												{grandchild.name}
																											</Typography>
																										}
																									/>
																								</ListItemButton>
																							)}
																						</ListItem>
																						{grandchild.children?.map((greatGrandchild) => {
																							const greatGrandchildKey = greatGrandchild.url ?? greatGrandchild.name
																							return (
																								<ListItem key={greatGrandchildKey} disablePadding>
																									<ListItemButton
																										component={Link}
																										href={greatGrandchild.url ?? '#'}
																										onClick={handleMobileToggle}
																										sx={{
																											pl: 8,
																											color: 'var(--color-text)',
																											'&:hover': {
																												backgroundColor: 'rgba(0, 0, 0, 0.04)',
																											},
																										}}
																									>
																										<ListItemText
																											primary={
																												<Typography variant='body2'>
																													{greatGrandchild.name}
																												</Typography>
																											}
																										/>
																									</ListItemButton>
																								</ListItem>
																							)
																						})}
																					</Box>
																				)
																			}

																			return (
																				<ListItem key={grandchildKey} disablePadding>
																					<ListItemButton
																						component={Link}
																						href={grandchild.url ?? '#'}
																						onClick={handleMobileToggle}
																						sx={{
																							pl: 6,
																							color: 'var(--color-text)',
																							'&:hover': {
																								backgroundColor: 'rgba(0, 0, 0, 0.04)',
																							},
																						}}
																					>
																						<ListItemText
																							primary={
																								<Typography variant='body2'>
																									{grandchild.name}
																								</Typography>
																							}
																						/>
																					</ListItemButton>
																				</ListItem>
																			)
																		})}
																	</Box>
																)
															}

															return (
																<ListItem key={childKey} disablePadding>
																	<ListItemButton
																		component={Link}
																		href={child.url ?? '#'}
																		onClick={handleMobileToggle}
																		sx={{
																			pl: 4,
																			color: 'var(--color-text)',
																			'&:hover': {
																				backgroundColor: 'rgba(0, 0, 0, 0.04)',
																			},
																		}}
																	>
																		<ListItemText
																			primary={
																				<Typography variant='body2'>
																					{child.name}
																				</Typography>
																			}
																		/>
																	</ListItemButton>
																</ListItem>
															)
														})}
													</List>
												</Collapse>
											</>
										) : item.url ? (
											<ListItem disablePadding>
												<ListItemButton
													component={Link}
													href={item.url}
													onClick={handleMobileToggle}
													sx={{
														color: 'var(--color-text)',
														'&:hover': {
															backgroundColor: 'rgba(0, 0, 0, 0.04)',
														},
													}}
												>
													<ListItemText
														primary={
															<Typography
																variant='body1'
																sx={{
																	fontSize: '1.125rem',
																	fontWeight: 500,
																}}
															>
																{item.name}
															</Typography>
														}
													/>
												</ListItemButton>
											</ListItem>
										) : (
											<ListItem disablePadding>
												<ListItemText
													primary={
														<Typography
															variant='body1'
															sx={{
																fontSize: '1.125rem',
																fontWeight: 500,
																color: 'var(--color-text)',
															}}
														>
															{item.name}
														</Typography>
													}
												/>
											</ListItem>
										)}
									</Box>
								)
							})}
						</List>
					</Box>
				</Drawer>
			</>
		)
	}

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 3,
			}}
		>
			{menuItems.map((item) => {
				const itemKey = item.url ?? item.name
				return (
					<Box key={itemKey}>
						<DesktopMenuItem item={item} theme={theme} />
					</Box>
				)
			})}
		</Box>
	)
}
