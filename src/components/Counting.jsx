import { useState } from 'react'
import { useRealtime } from '../context/RealtimeContext'

const Counting = ({ product, onClose }) => {
  const { updateProduct, refetchData } = useRealtime()

  // Sayıma başlarken mevcut stok değerlerini state'e aktaralım
  const [countedWarehouse, setCountedWarehouse] = useState(product.stock_warehouse)
  const [countedShelf, setCountedShelf] = useState(product.stock_shelf)

  // "Sayımı Güvenle Bitir" butonuna basıldığında çalışacak fonksiyon:
  const handleCompleteCount = async () => {
    try {
      // Kullanıcının girdiği değerlerle güncellenmiş ürün verisi:
      const updatedProduct = {
        ...product,
        stock_warehouse: Number(countedWarehouse),
        stock_shelf: Number(countedShelf),
        updated_at: new Date().toISOString()
      };

      // Güncelleme yaparken otomatik stok hareketi oluşturmayı atlamak için opsiyonu geçiyoruz:
      await updateProduct(product.id, updatedProduct, { skipStockMovement: true });
      
      // Güncelleme sonrası Realtime verilerin yeniden çekilmesi:
      refetchData();
      
      // Sayım modalını kapat:
      onClose();
    } catch (error) {
      console.error("Stok sayım güncellemesinde hata:", error);
    }
  };

  return (
    <div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Depo Stok:</label>
        <input
          type="number"
          value={countedWarehouse}
          onChange={(e) => setCountedWarehouse(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Raf Stok:</label>
        <input
          type="number"
          value={countedShelf}
          onChange={(e) => setCountedShelf(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={handleCompleteCount}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Sayımı Güvenle Bitir
      </button>
    </div>
  )
}

export default Counting 