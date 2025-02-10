import { useEffect } from 'react'
import { useData } from '../context/DataContext'

export default function useSlackNotifications() {
  const { products } = useData()

  useEffect(() => {
    if (!products || products.length === 0) return

    const webhookUrl = 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK' 
    const criticalItems = products.filter(p => p.stock.total <= p.stock.minStockLevel)
    const now = new Date()
    const threshold = new Date()
    threshold.setDate(now.getDate() + 30)

    const expiringSoon = products.filter(p => {
      if (!p.expiryDate) return false
      const expiry = new Date(p.expiryDate)
      return expiry <= threshold && expiry > now
    })

    if (criticalItems.length > 0 || expiringSoon.length > 0) {
      const message = `
*Dikkat!* 
Kritik stok: ${criticalItems.map(i => i.name).join(', ') || 'Yok'} 
SKT yaklaşanlar: ${expiringSoon.map(i => i.name).join(', ') || 'Yok'}
      `

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      })
      .then(() => console.log('Slack mesajı gönderildi'))
      .catch(err => console.error('Slack mesajı gönderilemedi:', err))
    }
  }, [products])
} 