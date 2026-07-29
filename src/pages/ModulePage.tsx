import Logo from '../components/common/Logo'

interface ModulePageProps {
  title: string
}

const ModulePage = ({ title }: ModulePageProps) => {
  return (
    <section className="module-page">
      <Logo size="small" showText showSubtitle className="module-logo" />
      <h2>{title}</h2>
      <p>This section is reserved for a future Atelier module.</p>
    </section>
  )
}

export default ModulePage
