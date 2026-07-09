import { AuthProvider } from './auth/AuthContext'
import { AuthControl } from './ui/components/AuthControl'

function App() {
  return (
    <AuthProvider>
      <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
        <h1>Arcade Hiring Review</h1>
        <p>Scaffold in progress — first-run setup wizard lands in a later milestone.</p>
        <AuthControl />
      </main>
    </AuthProvider>
  )
}

export default App
