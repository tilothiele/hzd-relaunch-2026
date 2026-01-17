import type { MenuItem } from '@/types'

export function getMenuItemUrl(menuItem: MenuItem): string {
    return menuItem.url ?? ''
}

export function getMenuItemLabel(menuItem: MenuItem): string {
    return menuItem.name ?? ''
}

export function getMenuItemIcon(menuItem: MenuItem): string {
    return menuItem.icon ?? ''
}

export function getMenuItemFaIcon(menuItem: MenuItem): string {
    return menuItem.faIcon ?? ''
}

export function getMenuItemBadgeText(menuItem: MenuItem): string | null {
    if (menuItem.id == 'aktuelles') {
        const n = Math.random() * 10
        return n.toFixed(0)
    }
    return null
}
