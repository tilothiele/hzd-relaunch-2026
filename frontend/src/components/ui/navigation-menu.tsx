'use client'

import { useState } from 'react'
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
				<Button
					onClick={handleClick}
					endIcon={<ExpandMoreIcon />}
					sx={{
						color: theme.headerFooterTextColor,
						fontSize: '1.25rem',
						fontWeight: 500,
						textTransform: 'none',
						'&:hover': {
							color: '#FCD34D',
							backgroundColor: 'transparent',
						},
					}}
				>
					{item.name}
				</Button>
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
							backgroundColor: '#F2F5F7',
							color: theme.textColor,
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
									<Typography
										variant='body1'
										sx={{
											fontSize: '1.125rem',
											fontWeight: 600,
											padding: '8px 16px',
											color: theme.textColor,
										}}
									>
										{child.name}
									</Typography>
									{child.children?.map((grandchild) => {
										const grandchildKey = grandchild.url ?? grandchild.name
										return (
											<MenuItem
												key={grandchildKey}
												component={Link}
												href={grandchild.url ?? '#'}
												onClick={handleClose}
												sx={{
													paddingLeft: 4,
													color: theme.textColor,
													'&:hover': {
														backgroundColor: 'rgba(252, 211, 77, 0.1)',
														color: '#FCD34D',
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
									color: theme.textColor,
									'&:hover': {
										backgroundColor: 'rgba(252, 211, 77, 0.1)',
										color: '#FCD34D',
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
					fontWeight: 500,
					textTransform: 'none',
					'&:hover': {
						color: '#FCD34D',
						backgroundColor: 'transparent',
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
				fontWeight: 500,
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
													<ListItemButton
														onClick={() => handleSubmenuToggle(itemKey)}
														sx={{
															color: theme.textColor,
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
																			<ListItemButton
																				sx={{
																					pl: 4,
																					color: theme.textColor,
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
																		</ListItem>
																		{child.children?.map((grandchild) => {
																			const grandchildKey = grandchild.url ?? grandchild.name
																			return (
																				<ListItem key={grandchildKey} disablePadding>
																					<ListItemButton
																						component={Link}
																						href={grandchild.url ?? '#'}
																						onClick={handleMobileToggle}
																						sx={{
																							pl: 6,
																							color: theme.textColor,
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
																			color: theme.textColor,
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
														color: theme.textColor,
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
																color: theme.textColor,
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
