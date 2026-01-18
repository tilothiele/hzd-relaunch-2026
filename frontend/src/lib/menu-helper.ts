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

export function getMenuItemBadgeCategory(menuItem: MenuItem): string | null {
    if (menuItem.id == 'aktuelles') {
        return `/${menuItem.id}`
    }
    return null
}
