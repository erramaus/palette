import Logo from '../components/common/Logo'

const LoadingPage = () => {
  return (
    <section className="loading-page">
      <div className="loading-card">
        <Logo size="large" showSubtitle showText className="loading-logo" />
        <p>Preparing production workspace...</p>
      </div>
    </section>
  )
}

export default LoadingPage
