import { useState } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import CountingModal from '../components/CountingModal'
import * as XLSX from 'xlsx'

function Counting() {
  const { products, addStockMovement, units, stockMovements } = useRealtime()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [countingList, setCountingList] = useState([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [completedList, setCompletedList] = useState(null)
  const [isReverting, setIsReverting] = useState(false)
  const [isSafeToComplete, setIsSafeToComplete] = useState(false)

  // Ürün arama ve filtreleme
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  )

  // Tüm ürünleri sayıma ekleme
  const handleAddAllToCount = () => {
    const newItems = filteredProducts
      .filter(product => !countingList.find(item => item.productId === product.id))
      .map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0),
        warehouseStock: Number(product?.stock_warehouse) || 0,
        shelfStock: Number(product?.stock_shelf) || 0,
        countedWarehouse: Number(product?.stock_warehouse) || 0,
        countedShelf: Number(product?.stock_shelf) || 0,
        unit: product.unit_id ? units.find(u => u.id === product.unit_id)?.name : 'Adet',
        difference: 0,
        price: Number(product?.price_buying) || 0,
        status: 'pending'
      }))

    setCountingList(prev => [...prev, ...newItems])
  }

  // Tüm ürünleri sayımdan çıkarma
  const handleRemoveAllFromCount = () => {
    setCountingList([])
  }

  // Sayım listesine ürün ekleme
  const handleAddToCount = (product) => {
    if (!countingList.find(item => item.productId === product.id)) {
      setCountingList(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        currentStock: (Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0),
        warehouseStock: Number(product?.stock_warehouse) || 0,
        shelfStock: Number(product?.stock_shelf) || 0,
        countedWarehouse: Number(product?.stock_warehouse) || 0,
        countedShelf: Number(product?.stock_shelf) || 0,
        unit: product.unit_id ? units.find(u => u.id === product.unit_id)?.name : 'Adet',
        difference: 0,
        price: Number(product?.price_buying) || 0,
        status: 'pending'
      }])
    }
  }

  // Sayım listesinden ürün çıkarma
  const handleRemoveFromCount = (productId) => {
    setCountingList(prev => prev.filter(item => item.productId !== productId))
  }

  // Sayım detaylarını düzenleme modalını açma
  const handleEditCount = (item) => {
    setSelectedProduct(item)
    setIsModalOpen(true)
  }

  // Modal kapanışını yönetme
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  // Sayım güncelleme
  const handleUpdateCount = (updatedItem) => {
    setCountingList(prev => prev.map(item =>
      item.productId === updatedItem.productId
        ? {
            ...updatedItem,
            difference: 
              (updatedItem.countedWarehouse + updatedItem.countedShelf) -
              (updatedItem.warehouseStock + updatedItem.shelfStock)
          }
        : item
    ))
  }

  // Sayımı tamamlama
  const handleCompleteCounting = async () => {
    setIsCompleting(true)
    try {
      // Her bir ürün için stok hareketlerini oluştur
      for (const item of countingList) {
        const totalDifference = 
          (item.countedWarehouse + item.countedShelf) -
          (item.warehouseStock + item.shelfStock)

        if (totalDifference !== 0) {
          const product = products.find(p => p.id === item.productId)
          await addStockMovement({
            type: totalDifference > 0 ? 'IN' : 'OUT',
            product_id: item.productId,
            quantity: Math.abs(totalDifference),
            unit_id: product.unit_id,
            unit_amount: product.unit_amount,
            price: item.price,
            total_price: item.price * Math.abs(totalDifference),
            vat_rate: product.vat_rate || 0,
            vat_amount: (item.price * Math.abs(totalDifference) * (product.vat_rate || 0)) / 100,
            document_no: `${totalDifference > 0 ? 'GIR' : 'CIK'}-${new Date().getFullYear()}-${String(stockMovements.length + 1).padStart(4, '0')}`,
            description: `Sayım ${totalDifference > 0 ? 'fazlası' : 'eksiği'}: ${item.note || ''}`,
            source_type: totalDifference > 0 ? 'COUNT_SURPLUS' : 'WAREHOUSE',
            source_id: totalDifference > 0 ? null : 'MAIN',
            source_name: totalDifference > 0 ? 'Sayım Fazlası' : 'Ana Depo',
            destination_type: totalDifference > 0 ? 'WAREHOUSE' : 'COUNT_SHORTAGE',
            destination_location: totalDifference > 0 ? 'MAIN' : 'ADJUSTMENT',
            created_by: 'SYSTEM',
            status: 'COMPLETED',
            created_at: new Date().toISOString()
          })
        }
      }

      // Excel raporu oluştur
      const reportData = countingList.map(item => {
        const totalDifference = (item.countedWarehouse + item.countedShelf) - (item.warehouseStock + item.shelfStock)
        const costDifference = totalDifference * item.price
        
        return {
          'Ürün Adı': item.productName,
          'Mevcut Stok': item.currentStock,
          'Sayılan Stok': item.countedWarehouse + item.countedShelf,
          'Fark': item.difference,
          'Birim': item.unit,
          'Depo Stok (Mevcut/Sayılan)': `${item.warehouseStock}/${item.countedWarehouse}`,
          'Raf Stok (Mevcut/Sayılan)': `${item.shelfStock}/${item.countedShelf}`,
          'Birim Maliyet': Number(item.price).toFixed(2),
          'Fark Maliyet': costDifference.toFixed(2),
          'Not': item.note || ''
        }
      })

      // Toplam maliyet farkını ekle
      const totalCostDifference = reportData.reduce((sum, item) => {
        return sum + (parseFloat(item['Fark']) * parseFloat(item['Birim Maliyet']))
      }, 0)

      // Boş satır ve toplam ekle
      reportData.push({})  // Boş satır
      reportData.push({
        'Ürün Adı': 'TOPLAM MALİYET FARKI:',
        'Fark Maliyet': totalCostDifference.toFixed(2) + ' TL'
      })

      // Excel dosyası oluştur
      const ws = XLSX.utils.json_to_sheet(reportData, { skipHeader: false })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sayım Raporu')

      // Sütun genişliklerini ayarla
      const colWidths = [
        { wch: 30 }, // Ürün Adı
        { wch: 15 }, // Mevcut Stok
        { wch: 15 }, // Sayılan Stok
        { wch: 10 }, // Fark
        { wch: 10 }, // Birim
        { wch: 25 }, // Depo Stok
        { wch: 25 }, // Raf Stok
        { wch: 15 }, // Birim Maliyet
        { wch: 15 }, // Fark Maliyet
        { wch: 30 }, // Not
      ]
      ws['!cols'] = colWidths

      // Dosyayı indir
      XLSX.writeFile(wb, `sayim_raporu_${new Date().toISOString().split('T')[0]}.xlsx`)

      // Tamamlanan listeyi sakla
      setCompletedList(countingList)
      // Sayım listesini temizle
      setCountingList([])
      setIsCompleting(false)
    } catch (error) {
      console.error('Sayım tamamlanırken hata oluştu:', error)
      setIsCompleting(false)
    }
  }

  // Sayımı güvenle bitir
  const handleSafeComplete = () => {
    setIsSafeToComplete(true)
    setCompletedList(null)
  }

  // Sayımı geri alma
  const handleRevertCounting = async () => {
    if (!completedList) return
    setIsReverting(true)
    try {
      // Her bir ürün için ters stok hareketi oluştur
      for (const item of completedList) {
        const totalDifference = (item.countedWarehouse + item.countedShelf) - (item.warehouseStock + item.shelfStock);

        if (totalDifference !== 0) {
          const product = products.find(p => p.id === item.productId);
          await addStockMovement({
            type: totalDifference > 0 ? 'OUT' : 'IN',
            product_id: item.productId,
            quantity: Math.abs(totalDifference),
            unit_id: product?.unit_id,
            unit_amount: product?.unit_amount,
            price: item.price,
            total_price: item.price * Math.abs(totalDifference),
            vat_rate: product?.vat_rate || 0,
            vat_amount: (item.price * Math.abs(totalDifference) * (product?.vat_rate || 0)) / 100,
            document_no: `${totalDifference > 0 ? 'GIR' : 'CIK'}-${new Date().getFullYear()}-${String(stockMovements.length + 1).padStart(4, '0')}`,
            description: `Sayım iptali: ${item.note || ''}`,
            source_type: totalDifference > 0 ? 'WAREHOUSE' : 'COUNT_SURPLUS',
            source_id: totalDifference > 0 ? null : 'MAIN',
            source_name: totalDifference > 0 ? 'Ana Depo' : 'Sayım Fazlası',
            destination_type: totalDifference > 0 ? 'COUNT_SHORTAGE' : 'WAREHOUSE',
            destination_location: totalDifference > 0 ? 'ADJUSTMENT' : 'MAIN',
            created_by: 'SYSTEM',
            status: 'COMPLETED',
            created_at: new Date().toISOString()
          });
        }
      }

      // Sayım listesini geri yükle
      setCountingList(completedList)
      setCompletedList(null)
      setIsReverting(false)
      setIsSafeToComplete(false)
    } catch (error) {
      console.error('Sayım geri alınırken hata oluştu:', error)
      setIsReverting(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stok Sayımı</h1>
        <div className="flex space-x-4">
          {completedList && !isSafeToComplete && (
            <>
              <button
                onClick={handleRevertCounting}
                disabled={isReverting}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400"
              >
                {isReverting ? 'Geri Alınıyor...' : 'Sayımı Geri Al'}
              </button>
              <button
                onClick={handleSafeComplete}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sayımı Güvenle Bitir
              </button>
            </>
          )}
          {countingList.length > 0 && (
            <button
              onClick={handleCompleteCounting}
              disabled={isCompleting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
            >
              {isCompleting ? 'Tamamlanıyor...' : 'Sayımı Tamamla'}
            </button>
          )}
        </div>
      </div>

      {/* Ürün Arama */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Ürün adı veya barkod ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ürün Listesi */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Ürünler</h2>
            <button
              onClick={handleAddAllToCount}
              className="text-indigo-600 hover:text-indigo-900"
            >
              Tümünü Ekle
            </button>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mevcut Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.barcode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(Number(product?.stock_warehouse) || 0) + (Number(product?.stock_shelf) || 0)} {product.unit_id ? units.find(u => u.id === product.unit_id)?.name : 'Adet'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleAddToCount(product)}
                        disabled={countingList.some(item => item.productId === product.id)}
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                      >
                        Sayıma Ekle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sayım Listesi */}
        <div className="bg-white shadow rounded-lg p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sayım Listesi</h2>




            {countingList.length > 0 && (
              <button
                onClick={handleRemoveAllFromCount}
                className="text-red-600 hover:text-red-900"
              >
                Tümünü Çıkar
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[600px] w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>



                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mevcut / Sayılan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fark
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maliyet Farkı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countingList.map(item => {
                  const costDifference = item.difference * item.price
                  return (
                    <tr key={item.productId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.currentStock} / {item.countedWarehouse + item.countedShelf} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full ${
                          item.difference > 0
                            ? 'bg-green-100 text-green-800'
                            : item.difference < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.difference > 0 ? '+' : ''}{item.difference} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full ${
                          costDifference > 0
                            ? 'bg-green-100 text-green-800'
                            : costDifference < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {costDifference > 0 ? '+' : ''}{costDifference.toFixed(2)} TL
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCount(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleRemoveFromCount(item.productId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Çıkar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {countingList.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      Toplam Maliyet Farkı:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        countingList.reduce((sum, item) => sum + (item.difference * item.price), 0) > 0
                          ? 'bg-green-100 text-green-800'
                          : countingList.reduce((sum, item) => sum + (item.difference * item.price), 0) < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {countingList.reduce((sum, item) => sum + (item.difference * item.price), 0).toFixed(2)} TL
                      </span>
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CountingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        countingItem={selectedProduct}
        onUpdate={handleUpdateCount}
      />
    </div>
  )
}

export default Counting 