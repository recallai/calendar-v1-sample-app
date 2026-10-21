import SignInButton from './SignInButton'

export default function SignIn() {
  const failed = new URLSearchParams(window.location.search).get('connection') === 'error'
  return <main className="sign-in-page">
    <div className="sign-in-options">
      <SignInButton platform="google" />
      <SignInButton platform="microsoft" />
    </div>
    {failed && <p role="alert">Sign-in failed. Please try again.</p>}
  </main>
}
