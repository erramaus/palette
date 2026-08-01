import Logo from '../components/common/Logo'
import { branding } from '../theme/branding'

const AboutPage = () => {
  return (
    <section className="page">
      <div className="panel about-panel">
        <Logo size="medium" showText variant="dark" className="about-logo" />
        <h2>{branding.appName}</h2>
        <p>
          Palette is production-management software built for fast, high-clarity daily
          operations in the Erin Hanson Gallery workflow.
        </p>
      </div>
    </section>
  )
}

export default AboutPage
