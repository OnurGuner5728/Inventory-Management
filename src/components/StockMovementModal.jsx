import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { useRealtime } from '../context/RealtimeContext'

function StockMovementModal({ isOpen, onClose }) {
  const { products, suppliers, addStockMovement } = useData()
  const { refetchData } = useRealtime()

  const [formData, setFormData] = useState({
    productId: '',
    type: 'IN',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    isUsable: true,
    source: {
      type: 'SUPPLIER',
      id: '',
      name: ''
    },
    destination: {
      type: 'WAREHOUSE',
      location: 'MAIN'
    }
  })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        productId: '',
        type: 'IN',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        isUsable: true,
        source: {
          type: 'SUPPLIER',
          id: '',
          name: ''
        },
        destination: {
          type: 'WAREHOUSE',
          location: 'MAIN'
        }
      })
      setSelectedProduct(null)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === Number(formData.productId))
      setSelectedProduct(product)
    } else {
      setSelectedProduct(null)
    }
  }, [formData.productId, products])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (!selectedProduct) {
        throw new Error('Lütfen bir ürün seçin')
      }

      const totalStock = Number(selectedProduct.stock_warehouse || 0) + Number(selectedProduct.stock_shelf || 0)
      if (formData.type === 'OUT' && totalStock < Number(formData.quantity)) {
        throw new Error('Yetersiz stok')
      }

      const movementData = {
        type: formData.type,
        product_id: Number(formData.productId),
        quantity: Number(formData.quantity),
        unit_id: selectedProduct.unit_id,
        unit_amount: selectedProduct.unit_amount || 1,
        price: selectedProduct.price_buying || 0,
        total_price: (selectedProduct.price_buying || 0) * Number(formData.quantity),
        vat_rate: selectedProduct.vat_rate || 0,
        vat_amount: ((selectedProduct.price_buying || 0) * Number(formData.quantity) * (selectedProduct.vat_rate || 0)) / 100,
        document_no: `${formData.type === 'IN' ? 'GIR' : formData.type === 'OUT' ? 'CIK' : formData.type === 'RETURN' ? 'IAD' : 'FIR'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        description: formData.note || 'Stok hareketi',
        created_at: new Date(formData.date).toISOString(),
        created_by: 'SYSTEM',
        status: 'COMPLETED',
        isUsable: formData.isUsable
      }

      // Hareket tipine göre kaynak ve hedef ayarla
      switch (formData.type) {
        case 'IN':
          movementData.source_type = 'SUPPLIER'
          movementData.source_id = String(selectedProduct.supplier_id || '')
          movementData.source_name = suppliers.find(s => s.id === selectedProduct.supplier_id)?.name || 'Bilinmiyor'
          movementData.destination_type = 'WAREHOUSE'
          movementData.destination_location = 'MAIN'
          break
        case 'OUT':
          movementData.source_type = 'WAREHOUSE'
          movementData.source_id = 'MAIN'
          movementData.source_name = 'Ana Depo'
          movementData.destination_type = 'CUSTOMER'
          movementData.destination_location = 'SALE'
          break
        case 'RETURN':
          movementData.source_type = 'CUSTOMER'
          movementData.source_id = 'RETURN'
          movementData.source_name = 'Müşteri İadesi'
          movementData.destination_type = 'WAREHOUSE'
          movementData.destination_location = 'MAIN'
          break
        case 'WASTE':
          movementData.source_type = 'WAREHOUSE'
          movementData.source_id = 'MAIN'
          movementData.source_name = 'Ana Depo'
          movementData.destination_type = 'WASTE'
          movementData.destination_location = 'WASTE'
          break
      }

      await addStockMovement(movementData)
      onClose()
      refetchData()
    } catch (error) {
      setError(error.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Yeni Stok Hareketi
          </h3>

          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hareket Tipi
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="IN">Giriş</option>
                <option value="OUT">Çıkış</option>
                <option value="RETURN">İade</option>
                <option value="WASTE">Fire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ürün
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Ürün Seçin</option>
                {products.map((product) => {
                  const totalStock = Number(product.stock_warehouse || 0) + Number(product.stock_shelf || 0)
                  return (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stok: {totalStock}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Miktar
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              {selectedProduct && (
                <p className="mt-1 text-sm text-gray-500">
                  Mevcut Stok: {Number(selectedProduct.stock_warehouse || 0) + Number(selectedProduct.stock_shelf || 0)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tarih
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Not
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Hareket ile ilgili açıklama ekleyin"
              />
            </div>

            {formData.type === 'RETURN' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ürün Kullanılabilir mi?
                </label>
                <input
                  type="checkbox"
                  checked={formData.isUsable}
                  onChange={(e) => setFormData({ ...formData, isUsable: e.target.checked })}
                  className="mt-1 form-checkbox"
                  data-cy="usable-checkbox"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Eğer işaretli değilse, iade sonrası fire işlemi oluşturulacaktır.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                İptal
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StockMovementModal 