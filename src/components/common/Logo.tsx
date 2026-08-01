import { branding } from '../../theme/branding'
import paletteIcon from '../../assets/palette-icon.png'
import { useState } from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  variant?: 'light' | 'dark'
  className?: string
}

const Logo = ({
  size = 'medium',
  showText = true,
  variant = 'dark',
  className = '',
}: LogoProps) => {
  const [logoSrc, setLogoSrc] = useState(paletteIcon)

  return (
    <div className={`logo-wrap logo-wrap-${size} logo-variant-${variant} ${className}`.trim()}>
      <img
        src={logoSrc}
        alt="Palette"
        className="palette-logo-image"
        onError={() => {
          const fallback = `${import.meta.env.BASE_URL}assets/palette-icon.png`
          if (logoSrc !== fallback) {
            setLogoSrc(fallback)
          }
        }}
      />
      {showText ? (
        <div className="logo-text-block">
          <strong className="logo-wordmark">{branding.appNameDisplayUpper}</strong>
          <span>{branding.subtitle}</span>
        </div>
      ) : null}
    </div>
  )
}

export default Logo
