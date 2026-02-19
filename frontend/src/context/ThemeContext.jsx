import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('mulenet-theme')
        return saved ? saved === 'dark' : true // default dark
    })

    useEffect(() => {
        const root = document.documentElement
        if (dark) {
            root.classList.add('dark')
            root.classList.remove('light')
        } else {
            root.classList.add('light')
            root.classList.remove('dark')
        }
        localStorage.setItem('mulenet-theme', dark ? 'dark' : 'light')
    }, [dark])

    const toggle = () => setDark(d => !d)

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
