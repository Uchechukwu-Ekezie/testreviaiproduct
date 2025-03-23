"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("dark")
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    
    if (savedTheme && savedTheme === "light") {
      setTheme(savedTheme)
    }
  }, [])
  
  // Update document class and localStorage when theme changes
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
    
    localStorage.setItem("theme", theme)
  }, [theme])
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
} 