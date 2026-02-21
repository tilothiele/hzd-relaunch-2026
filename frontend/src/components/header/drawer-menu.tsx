'use client'

import React, { useState } from 'react'
import {
    SwipeableDrawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Box,
    Collapse,
    Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CloseIcon from '@mui/icons-material/Close'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCalendar,
    faLock,
    faLockOpen,
    faUser,
    faVenusMars,
    faBullhorn,
    faPoll,
    faAward,
    faFile,
    faComment,
    faBone,
    faCircle,
    faHouse,
    faNewspaper,
    faFileLines as faReport,
    faUserGroup,
    faPaw,
    faEnvelope,
    faSliders,
    faBell,
    faCamera,
} from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import type { Menu as MenuType, MenuItem as MenuItemType, AuthUser } from '@/types'
import type { ThemeDefinition } from '@/themes'
import {
    getMenuItemUrl,
    getMenuItemLabel,
    getMenuItemIcon,
    getMenuItemBadgeCategory,
    getMenuItemEnabled
} from '@/lib/menu-helper'
import { useBadgeNumber } from '@/lib/badge-numbers'

function MenuItemBadge({ category, theme }: { category: string, theme: ThemeDefinition }) {
    const { badgeNumber, loading } = useBadgeNumber(category)

    if (loading || !badgeNumber || badgeNumber === 0) return null

    return (
        <Box
            component="span"
            sx={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {badgeNumber}
        </Box>
    )
}

// Map icon strings from JSON to FontAwesome icons
const iconMap: Record<string, any> = {
    'fa-calendar': faCalendar,
    'fa-paw': faPaw, // "Welpen/Würfe" -> Paw
    'fa-venus-mars': faVenusMars,
    'fa-speaker': faBullhorn,
    'fa-result': faPoll,
    'fa-letter': faEnvelope,
    'fa-bone': faBone,
    'fa-comment': faComment,
    'fa-report': faReport,
    'fa-file': faFile,
    'fa-user': faUser,
    'fa-lock': faLock,
    'fa-lock-open': faLockOpen,
    'fa-home': faHouse,
    'fa-newspaper': faNewspaper,
    'fa-users': faUserGroup,
    'fa-award': faAward,
    'fa-sliders': faSliders,
    'fa-bell': faBell,
    'fa-camera': faCamera,
}

const getIcon = (iconName?: string) => {
    if (!iconName) return faCircle
    return iconMap[iconName] || faCircle
}

interface DrawerMenuProps {
    drawerMenu: MenuType | null | undefined
    theme: ThemeDefinition
    user: AuthUser | null
}

export function DrawerMenuComponent({ drawerMenu, theme, user }: DrawerMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event &&
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return
        }
        setIsOpen(open)
    }

    const handleSubmenuToggle = (e: React.MouseEvent<unknown>, name: string) => {
        e.stopPropagation()
        setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }))
    }

    const renderMenuItem = (item: MenuItemType, level = 0) => {
        const isEnabled = getMenuItemEnabled(item, user)
        // If disabled, we treat it as having no children to prevent expansion
        const hasChildren = isEnabled && item.children && item.children.length > 0
        const label = getMenuItemLabel(item)
        const isSubOpen = openSubmenus[label]
        const icon = getMenuItemIcon(item, user)
        const url = getMenuItemUrl(item)
        const badgeCategory = getMenuItemBadgeCategory(item)

        return (
            <React.Fragment key={label}>
                <ListItem
                    disablePadding
                    secondaryAction={
                        hasChildren && (
                            <IconButton
                                edge="end"
                                onClick={(e) => handleSubmenuToggle(e, label)}
                                sx={{ color: theme.drawerText, mr: 1 }}
                            >
                                {isSubOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        )
                    }
                >
                    <ListItemButton
                        component={url && isEnabled ? Link : 'div'}
                        href={(url && isEnabled) ? url : undefined}
                        disabled={!isEnabled}
                        onClick={(!url && hasChildren && isEnabled) ? (e: React.MouseEvent<unknown>) => handleSubmenuToggle(e, label) : (!isEnabled ? undefined : toggleDrawer(false))}
                        sx={{
                            pl: level * 3 + 2,
                            pr: hasChildren ? 7 : 2,
                            opacity: isEnabled ? 1 : 0.5,
                            pointerEvents: isEnabled ? 'auto' : 'none',
                            '&:hover': {
                                backgroundColor: isEnabled ? 'rgba(26, 54, 115, 0.04)' : 'transparent',
                            },
                        }}
                    >
                        {level === 0 && (
                            <ListItemIcon sx={{ minWidth: 40, color: theme.drawerText }}>
                                <FontAwesomeIcon icon={getIcon(icon)} />
                            </ListItemIcon>
                        )}
                        <ListItemText
                            primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {label}
                                    {badgeCategory && (
                                        <MenuItemBadge category={badgeCategory} theme={theme} />
                                    )}
                                </Box>
                            }
                            primaryTypographyProps={{
                                fontWeight: level === 0 ? 600 : 400,
                                fontSize: level === 0 ? '1rem' : '0.8rem',
                                color: level === 0 ? theme.drawerText : 'var(--color-text)',
                            }}
                        />
                    </ListItemButton>
                </ListItem>
                {hasChildren && (
                    <Collapse in={isSubOpen} timeout='auto' unmountOnExit>
                        <List component='div' disablePadding>
                            {item.children?.map((child) => renderMenuItem(child, level + 1))}
                        </List>
                    </Collapse>
                )}
            </React.Fragment>
        )
    }

    let parsedMenu = drawerMenu
    if (typeof drawerMenu === 'string') {
        try {
            parsedMenu = JSON.parse(drawerMenu)
        } catch (e) {
            console.error('Error parsing DrawerMenu string:', e)
        }
    }

    const items = Array.isArray(parsedMenu) ? parsedMenu : (parsedMenu as any)?.items
    const hasItems = Array.isArray(items) && items.length > 0

    if (!hasItems && !drawerMenu) return null

    return (
        <>
            {/* Visible Edge Trigger */}
            {!isOpen && (
                <Box
                    onMouseEnter={toggleDrawer(true)}
                    onClick={toggleDrawer(true)}
                    sx={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '12px',
                        zIndex: 2000,
                        cursor: 'pointer',
                        '&:hover': {
                            '& .drawer-handle': {
                                transform: 'scaleX(1.1)',
                                backgroundColor: 'var(--color-primary)',
                                left: '4px',
                            },
                            '& .drawer-bar': {
                                opacity: 0.8,
                            }
                        },
                    }}
                >
                    {/* The vertical bar */}
                    <Box
                        className="drawer-bar"
                        sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '6px',
                            background: `linear-gradient(to right, ${theme.headerBackground} 0%, transparent 100%)`,
                            opacity: 0.2,
                            transition: 'opacity 0.2s',
                        }}
                    />

                    {/* The Handle (Anfasser) */}
                    <Box
                        className="drawer-handle"
                        sx={{
                            position: 'absolute',
                            top: '7rem',
                            left: '2px',
                            width: '24px',
                            height: '80px',
                            backgroundColor: theme.drawerHandle, // Theme Handle Color
                            borderRadius: '0 12px 12px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
                            zIndex: 2001,
                        }}
                    >
                        <Box sx={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: 'white',
                            borderRadius: '2px',
                            opacity: 0.8
                        }} />
                    </Box>
                </Box>
            )}
            <SwipeableDrawer
                anchor='left'
                open={isOpen}
                onClose={toggleDrawer(false)}
                onOpen={toggleDrawer(true)}
                swipeAreaWidth={30}
                disableBackdropTransition={false}
                disableDiscovery={false}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 320,
                        backgroundColor: theme.drawerBackground,
                        borderRight: 'none',
                        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
                    },
                }}
            >
                <Box sx={{ width: 320, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            mb: 1
                        }}
                    >
                        <Typography variant='h6' sx={{ fontWeight: 800, color: theme.drawerText, letterSpacing: '-0.02em' }}>
                            Powermenü
                        </Typography>
                        <IconButton onClick={toggleDrawer(false)} size='small'>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ overflowY: 'auto', flex: 1, pb: 4 }}>
                        <List sx={{ pt: 0 }}>
                            {Array.isArray(items) && items.map((item: MenuItemType) => renderMenuItem(item))}
                        </List>
                    </Box>
                </Box>
            </SwipeableDrawer>
        </>
    )
}
