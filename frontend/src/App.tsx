import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    fetch('/api/health')
      .then(response => {
        if (!response.ok) throw new Error('API Error')
        return response.json()
      })
      .then(data => {
        setStatus(data.status === 'ok' ? 'Connected' : 'Unexpected response')
      })
      .catch(() => setStatus('Not connected'))
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: 'Arial' }}>
      <h1>Lunar-Si</h1>
      <p>Lunar Landing Site Navigator</p>
      <p>Backend Status: <strong>{status}</strong></p>
    </main>
  )
}

export default App