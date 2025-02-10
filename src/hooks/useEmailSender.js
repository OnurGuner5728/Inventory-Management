import { useState } from 'react'

export default function useEmailSender() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const sendEmailReport = async (reportData) => {
    setLoading(true)
    setStatus(null)
    try {
      // Örnek POST isteği - kendi API'nize veya üçüncü taraf servise
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData })
      })
      if (!response.ok) {
        throw new Error('E-posta gönderilemedi.')
      }
      setStatus('E-posta başarıyla gönderildi!')
    } catch (error) {
      setStatus('E-posta gönderilirken hata oluştu.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return { sendEmailReport, loading, status }
} 