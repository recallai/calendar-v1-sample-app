import SignIn from './SignIn'
import Configuration from './Configuration'
import Calendar from './Calendar'

export default function App() {
  if (window.location.pathname === '/calendar') return <Calendar />
  if (window.location.pathname === '/configuration') return <Configuration />
  return <SignIn />
}
