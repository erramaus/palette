import Logo from '../components/common/Logo'

interface ModulePageProps {
  title: string
}

const ModulePage = ({ title }: ModulePageProps) => {
  return (
    <section className="module-page">
      <Logo size="small" showText variant="dark" className="module-logo" />
      <h2>{title}</h2>
      <p>This section is reserved for a future Palette module.</p>
    </section>
  )
}

export default ModulePage
