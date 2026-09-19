import type { MenuItem, AuthUser } from '@/types'
import { isBreeder, isDeckruedenbesitzer, isKoermeister, isSonderleiter } from './permissions'

export function getMenuItemUrl(menuItem: MenuItem): string {
    return menuItem.url ?? ''
}

export function getMenuItemLabel(menuItem: MenuItem): string {
    return menuItem.name ?? ''
}

export function getMenuItemIcon(menuItem: MenuItem, _user: AuthUser | null): string {
    if (menuItem.id == 'mitgliederbereich') {
        return _user == null ? 'fa-lock' : 'fa-lock-open'
    }
    return menuItem.icon ?? ''
}

export function getMenuItemEnabled(menuItem: MenuItem, _user: AuthUser | null): boolean {
    if (menuItem.id == 'mitgliederbereich' || menuItem.id == 'photobox') {
        return _user != null
    }
    if (menuItem.id == 'koermeister') {
        return isKoermeister(_user)
    }
    if (menuItem.id == 'sonderleiter' || menuItem.id == 'anmeldungen') {
        return isSonderleiter(_user)
    }
    if (menuItem.id == 'zuechter') {
        return isBreeder(_user)
    }
    if (menuItem.id == 'deckruedenbesitzer') {
        return isDeckruedenbesitzer(_user)
    }
    return true
}

export function getMenuItemBadgeCategory(menuItem: MenuItem): string | null {
    if (menuItem.id == 'aktuelles') {
        return `/${menuItem.id}`
    }
    return null
}
