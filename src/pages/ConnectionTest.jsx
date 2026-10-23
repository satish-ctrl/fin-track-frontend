
import { useEffect, useState } from 'react'
import api from '../services/api'

function ConnectionTest() {
  const [status, setStatus] = useState('Testing connection...')
  const [response, setResponse] = useState(null)

  useEffect(() => {
    api.get('/api/auth')
      .then((result) => {
        setStatus('Backend connection successful!')
        setResponse(result.data)
      })
      .catch((error) => {
        setStatus('Backend connection failed.')
        setResponse({
          message: error.message,
          httpStatus: error.response?.status ?? 'No HTTP response',
          details: error.response?.data ?? null,
        })
      })
  }, [])

  return (
    <main style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <h1>FinTrack Connection Test</h1>
      <h2>{status}</h2>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {response === null ? 'Waiting for response...' : JSON.stringify(response, null, 2)}
      </pre>
    </main>
  )
}

export default ConnectionTest
