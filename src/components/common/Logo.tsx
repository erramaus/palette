import { branding } from '../../theme/branding'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  showSubtitle?: boolean
  className?: string
}

const Logo = ({
  size = 'medium',
  showText = true,
  showSubtitle = true,
  className = '',
}: LogoProps) => {
  return (
    <div className={`logo-wrap logo-wrap-${size} ${className}`.trim()}>
      <img
        src={branding.iconPath}
        alt="Atelier icon"
        className={`app-logo app-logo-${size}`}
        loading="eager"
        decoding="async"
      />
      {showText ? (
        <div className="logo-text-block">
          <strong className="logo-wordmark">{branding.appNameDisplayUpper}</strong>
          {showSubtitle ? <span>{branding.subtitle}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export default Logo
