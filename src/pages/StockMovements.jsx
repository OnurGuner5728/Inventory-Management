import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import StockMovementModal from '../components/StockMovementModal'

const StockMovements = () => {
  const { stockMovements, products, units } = useRealtime()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    productId: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (stockMovements) {
      setLoading(false);
    }
  }, [stockMovements])

  // Realtime güncellemeleri dinle
  useEffect(() => {
    if (stockMovements && stockMovements.length > 0) {
      console.log('Realtime stok hareketi güncellemesi:', stockMovements)
    }
  }, [stockMovements])

  // Hareket tiplerini Türkçe göstermek için
  const movementTypes = {
    IN: 'Giriş',
    OUT: 'Çıkış',
    RETURN: 'İade',
    WASTE: 'Fire'
  }

  // Filtreleme işlemi
  const filteredMovements = stockMovements.filter(movement => {
    // Hareket tipi filtresi
    if (filters.type && movement.type !== filters.type) return false
    
    // Ürün filtresi
    if (filters.productId && Number(movement.product_id) !== Number(filters.productId)) return false
    
    // Tarih filtreleri
    const movementDate = new Date(movement.created_at)
    movementDate.setHours(0, 0, 0, 0) // Saat bilgisini sıfırla
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (movementDate < startDate) return false
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // Günün sonuna ayarla
      if (movementDate > endDate) return false
    }
    
    return true
  })

  // Fiyat formatlama
  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price)
  }

  // Tarih formatlama
  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR')
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stok Hareketleri</h1>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => setIsModalOpen(true)}
        >
          Yeni Hareket
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hareket Tipi
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Tüm Hareketler</option>
              {Object.entries(movementTypes).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün
            </label>
            <select
              value={filters.productId}
              onChange={(e) => setFilters(prev => ({ ...prev, productId: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Tüm Ürünler</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Stok Hareketleri Tablosu */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Belge No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hareket Tipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birim Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KDV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kaynak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hedef
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr key="no-data">
                  <td colSpan="12" className="px-6 py-4 text-center text-sm text-gray-500">
                    Hareket bulunamadı
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement, index) => {
                  const product = products.find(p => p.id === movement.product_id)
                  return (
                    <tr key={movement.id ? `movement-${movement.id}-${index}` : `movement-${movement.document_no}-${movement.created_at}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.document_no || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.created_at ? new Date(movement.created_at).toLocaleDateString('tr-TR') : 'Invalid Date'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movementTypes[movement.type] || movement.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.quantity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.unit_id ? units.find(u => u.id === movement.unit_id)?.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.price ? `₺${Number(movement.price).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.total_price ? `₺${Number(movement.total_price).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.vat_rate ? `%${movement.vat_rate}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.source_name || movement.source_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.destination_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          movement.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {movement.status === 'COMPLETED' ? 'Tamamlandı' : 'Beklemede'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockMovementModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  )
}

export default StockMovements