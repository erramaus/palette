import Logo from '../components/common/Logo'

const LoadingPage = () => {
  return (
    <section className="loading-page">
      <div className="loading-card">
        <Logo size="large" showText variant="light" className="loading-logo" />
        <p>Preparing production workspace...</p>
      </div>
    </section>
  )
}

export default LoadingPage
