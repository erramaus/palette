import Logo from '../components/common/Logo'

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-card">
        <Logo size="large" showSubtitle showText className="login-logo" />
        <form className="login-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Username
            <input type="text" name="username" autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" name="password" autoComplete="current-password" />
          </label>
          <button type="submit" className="btn btn-primary">
            Sign In
          </button>
        </form>
        <p className="login-note">
          Authentication is not yet implemented.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
