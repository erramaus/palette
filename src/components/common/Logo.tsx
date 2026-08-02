import { branding } from '../../theme/branding'
import paletteIconGrid from '../../assets/palette-icon.svg'
import paletteIconTransparent from '../../assets/palette-icon-transparent.svg'
import { useEffect, useMemo, useState } from 'react'

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
  const preferredLogoSrc = useMemo(
    () => (variant === 'light' ? paletteIconTransparent : paletteIconGrid),
    [variant],
  )
  const [logoSrc, setLogoSrc] = useState(preferredLogoSrc)

  useEffect(() => {
    setLogoSrc(preferredLogoSrc)
  }, [preferredLogoSrc])

  return (
    <div className={`logo-wrap logo-wrap-${size} logo-variant-${variant} ${className}`.trim()}>
      <img
        src={logoSrc}
        alt="Palette"
        className="palette-logo-image"
        onError={() => {
          const fallback = `${import.meta.env.BASE_URL}assets/${
            variant === 'light' ? 'palette-icon-transparent.svg' : 'palette-icon.svg'
          }`
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
