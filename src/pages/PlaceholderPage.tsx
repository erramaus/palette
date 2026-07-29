interface PlaceholderPageProps {
  title: string
}

const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <section className="placeholder-page">
      <h2>{title}</h2>
      <p>This section is reserved for a future Atelier module.</p>
    </section>
  )
}

export default PlaceholderPage
