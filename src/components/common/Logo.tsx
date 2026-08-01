import { branding } from '../../theme/branding'
import paletteIcon from '../../assets/palette-icon.png'

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
  return (
    <div className={`logo-wrap logo-wrap-${size} logo-variant-${variant} ${className}`.trim()}>
      <img
        src={paletteIcon}
        alt="Palette"
        className="palette-logo-image"
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
