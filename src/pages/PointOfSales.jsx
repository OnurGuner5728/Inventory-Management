import React, { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useRealtime } from '../context/RealtimeContext'

const PointOfSales = () => {
  // DataContext'ten satış işlemi fonksiyonunu alıyoruz ve RealtimeContext'ten güncel ürün listesini çekiyoruz
  const { handleProductSale } = useData()
  const { products } = useRealtime()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  const [receipt, setReceipt] = useState(null) // Final receipt after checkout

  // Live receipt preview computed from cart dynamically
  const liveReceipt = useMemo(() => {
    if (cart.length === 0) return null
    const computedItems = cart.map(item => {
      const unitPrice = Number(item.price_selling) || 0
      const vatRate = Number(item.vat_rate) || 0
      const quantity = item.quantity
      const lineSubtotal = unitPrice * quantity
      const lineVat = (lineSubtotal * vatRate) / 100
      const lineTotal = lineSubtotal + lineVat
      return {
        id: item.id,
        name: item.name,
        unitPrice,
        vatRate,
        quantity,
        lineSubtotal,
        lineVat,
        lineTotal
      }
    })
    const subtotal = computedItems.reduce((sum, curr) => sum + curr.lineSubtotal, 0)
    const totalVat = computedItems.reduce((sum, curr) => sum + curr.lineVat, 0)
    const grandTotal = subtotal + totalVat
    return {
      receiptNumber: 'ÖNİZLEME',
      date: new Date().toLocaleString('tr-TR'),
      items: computedItems,
      subtotal,
      totalVat,
      grandTotal
    }
  }, [cart])

  // Sepete ürün ekleme; ürün zaten varsa miktarı artır
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id)
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  // Sepetten ürün çıkarma; ürün miktarı 1 ise kaldır
  const removeFromCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity === 1) {
          return prevCart.filter(item => item.id !== product.id)
        } else {
          return prevCart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
          )
        }
      }
      return prevCart
    })
  }

  // Satış işlemini gerçekleştirme; sepet boşsa uyarı ver, aksi halde satış işlemini başlat
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Sepet boş!')
      return
    }
    try {
      // Satış işlemi gerçekleştiriliyor
      await handleProductSale(cart)
      
      // Final receipt hesaplamaları
      const computedItems = cart.map(item => {
        const unitPrice = Number(item.price_selling) || 0
        const vatRate = Number(item.vat_rate) || 0
        const quantity = item.quantity
        const lineSubtotal = unitPrice * quantity
        const lineVat = (lineSubtotal * vatRate) / 100
        const lineTotal = lineSubtotal + lineVat
        return {
          id: item.id,
          name: item.name,
          unitPrice,
          vatRate,
          quantity,
          lineSubtotal,
          lineVat,
          lineTotal
        }
      })

      const subtotal = computedItems.reduce((sum, curr) => sum + curr.lineSubtotal, 0)
      const totalVat = computedItems.reduce((sum, curr) => sum + curr.lineVat, 0)
      const grandTotal = subtotal + totalVat
      
      const receiptData = {
        receiptNumber: 'FIS-' + Date.now(),
        date: new Date().toLocaleString('tr-TR'),
        items: computedItems,
        subtotal,
        totalVat,
        grandTotal
      }

      setReceipt(receiptData)
      
      alert('Satış gerçekleştirildi')
      setCart([])
    } catch (error) {
      alert(`Satış işlemi sırasında hata: ${error.message}`)
    }
  }

  // Arama terimine göre filtrelenmiş ürün listesi
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Nakit Satış</h2>
      <div className="mb-4">
         <input
           type="text"
           placeholder="Ürün ara..."
           className="w-full p-2 border rounded"
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
         />
      </div>
      <div className="grid grid-cols-2 gap-4">
         <div>
           <h3 className="text-xl font-semibold mb-2">Ürün Listesi</h3>
           <ul>
              {filteredProducts.map(product => (
                <li key={product.id} className="flex justify-between items-center p-2 border rounded mb-2">
                   <span>{product.name}</span>
                   <button 
                     className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                     onClick={() => addToCart(product)}
                   >Ekle</button>
                </li>
              ))}
           </ul>
         </div>
         <div>
           <h3 className="text-xl font-semibold mb-2">Sepet</h3>
           {cart.length === 0 ? 
             <p>Sepetiniz boş.</p>
             :
             <ul>
               {cart.map(item => (
                 <li key={item.id} className="flex justify-between items-center p-2 border rounded mb-2">
                   <span>{item.name} (x{item.quantity})</span>
                   <button 
                     className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                     onClick={() => removeFromCart(item)}
                   >Çıkar</button>
                 </li>
               ))}
             </ul>
           }
           <div className="mt-4">
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
                onClick={handleCheckout}
              >Satışı Gerçekleştir</button>
           </div>
         </div>
      </div>

      {/* Receipt Display Section */}
      { receipt ? (
        <div className="mt-8 p-4 border rounded shadow-lg">
          <h2 className="text-xl font-bold mb-4">Fiş</h2>
          <p>Fiş Numarası: {receipt.receiptNumber}</p>
          <p>Tarih: {receipt.date}</p>
          <table className="w-full mt-4 border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1">Ürün</th>
                <th className="border px-2 py-1">Birim Fiyatı</th>
                <th className="border px-2 py-1">Adet</th>
                <th className="border px-2 py-1">Ara Toplam</th>
                <th className="border px-2 py-1">KDV (%)</th>
                <th className="border px-2 py-1">KDV Tutarı</th>
                <th className="border px-2 py-1">Satış Toplamı</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map(item => (
                <tr key={item.id}>
                  <td className="border px-2 py-1">{item.name}</td>
                  <td className="border px-2 py-1">{item.unitPrice.toFixed(2)}</td>
                  <td className="border px-2 py-1">{item.quantity}</td>
                  <td className="border px-2 py-1">{item.lineSubtotal.toFixed(2)}</td>
                  <td className="border px-2 py-1">{item.vatRate}%</td>
                  <td className="border px-2 py-1">{item.lineVat.toFixed(2)}</td>
                  <td className="border px-2 py-1">{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right font-bold">
            <p>Ara Toplam: {receipt.subtotal.toFixed(2)}</p>
            <p>Toplam KDV: {receipt.totalVat.toFixed(2)}</p>
            <p>Genel Toplam: {receipt.grandTotal.toFixed(2)}</p>
          </div>
        </div>
      ) : (
        liveReceipt && (
          <div className="mt-8 p-4 border rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Fiş Önizlemesi</h2>
            <p>Fiş Numarası: {liveReceipt.receiptNumber}</p>
            <p>Tarih: {liveReceipt.date}</p>
            <table className="w-full mt-4 border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Ürün</th>
                  <th className="border px-2 py-1">Birim Fiyatı</th>
                  <th className="border px-2 py-1">Adet</th>
                  <th className="border px-2 py-1">Ara Toplam</th>
                  <th className="border px-2 py-1">KDV (%)</th>
                  <th className="border px-2 py-1">KDV Tutarı</th>
                  <th className="border px-2 py-1">Satış Toplamı</th>
                </tr>
              </thead>
              <tbody>
                {liveReceipt.items.map(item => (
                  <tr key={item.id}>
                    <td className="border px-2 py-1">{item.name}</td>
                    <td className="border px-2 py-1">{item.unitPrice.toFixed(2)}</td>
                    <td className="border px-2 py-1">{item.quantity}</td>
                    <td className="border px-2 py-1">{item.lineSubtotal.toFixed(2)}</td>
                    <td className="border px-2 py-1">{item.vatRate}%</td>
                    <td className="border px-2 py-1">{item.lineVat.toFixed(2)}</td>
                    <td className="border px-2 py-1">{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right font-bold">
              <p>Ara Toplam: {liveReceipt.subtotal.toFixed(2)}</p>
              <p>Toplam KDV: {liveReceipt.totalVat.toFixed(2)}</p>
              <p>Genel Toplam: {liveReceipt.grandTotal.toFixed(2)}</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}

export default PointOfSales 