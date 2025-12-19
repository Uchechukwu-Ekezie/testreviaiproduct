import type React from "react"

interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false, className = "" }) => {
  const baseStyles = "px-4 py-2 rounded-[15px] font-medium transition-all"
 

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles}  ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  )
}

export default Button

