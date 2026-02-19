export interface ChatTheme {
    id: string
    label: string
    // Avatar / accent color classes
    avatarBg: string        // bg gradient for bot avatar circle
    userBubbleBg: string    // bg gradient for user bubble
    userBubbleText: string
    linkColor: string       // color for markdown links
    // UI accents
    accentRing: string      // focus ring on input
    headerBg: string        // header background
    pageBg: string          // page background gradient
}

export const CHAT_THEMES: Record<string, ChatTheme> = {
    blue: {
        id: 'blue',
        label: 'Azul (predeterminado)',
        avatarBg: 'from-blue-500 to-indigo-600',
        userBubbleBg: 'from-blue-600 to-indigo-600',
        userBubbleText: 'text-white',
        linkColor: 'text-blue-600 hover:text-blue-800',
        accentRing: 'focus:ring-blue-500',
        headerBg: 'bg-white',
        pageBg: 'from-slate-50 to-white',
    },
    emerald: {
        id: 'emerald',
        label: 'Verde esmeralda',
        avatarBg: 'from-emerald-500 to-teal-600',
        userBubbleBg: 'from-emerald-600 to-teal-600',
        userBubbleText: 'text-white',
        linkColor: 'text-emerald-600 hover:text-emerald-800',
        accentRing: 'focus:ring-emerald-500',
        headerBg: 'bg-white',
        pageBg: 'from-emerald-50/40 to-white',
    },
    violet: {
        id: 'violet',
        label: 'Violeta',
        avatarBg: 'from-violet-500 to-purple-600',
        userBubbleBg: 'from-violet-600 to-purple-600',
        userBubbleText: 'text-white',
        linkColor: 'text-violet-600 hover:text-violet-800',
        accentRing: 'focus:ring-violet-500',
        headerBg: 'bg-white',
        pageBg: 'from-violet-50/40 to-white',
    },
    rose: {
        id: 'rose',
        label: 'Rojo/Rosa',
        avatarBg: 'from-rose-500 to-pink-600',
        userBubbleBg: 'from-rose-600 to-pink-600',
        userBubbleText: 'text-white',
        linkColor: 'text-rose-600 hover:text-rose-800',
        accentRing: 'focus:ring-rose-500',
        headerBg: 'bg-white',
        pageBg: 'from-rose-50/40 to-white',
    },
    amber: {
        id: 'amber',
        label: 'Naranja/Ámbar',
        avatarBg: 'from-amber-500 to-orange-600',
        userBubbleBg: 'from-amber-500 to-orange-500',
        userBubbleText: 'text-white',
        linkColor: 'text-amber-600 hover:text-amber-800',
        accentRing: 'focus:ring-amber-500',
        headerBg: 'bg-white',
        pageBg: 'from-amber-50/40 to-white',
    },
    slate: {
        id: 'slate',
        label: 'Gris oscuro',
        avatarBg: 'from-slate-600 to-slate-800',
        userBubbleBg: 'from-slate-700 to-slate-800',
        userBubbleText: 'text-white',
        linkColor: 'text-slate-700 hover:text-slate-900',
        accentRing: 'focus:ring-slate-500',
        headerBg: 'bg-white',
        pageBg: 'from-slate-50 to-white',
    },
}

export const DEFAULT_THEME = CHAT_THEMES.blue
export function getTheme(id?: string | null): ChatTheme {
    return CHAT_THEMES[id ?? ''] ?? DEFAULT_THEME
}
