import { useState, useEffect } from 'react'

function CountingModal({ isOpen, onClose, countingItem, onUpdate }) {
  const [formData, setFormData] = useState({
    warehouseStock: 0,
    shelfStock: 0,
    note: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (countingItem) {
      setFormData({
        warehouseStock: countingItem.countedWarehouse,
        shelfStock: countingItem.countedShelf,
        note: ''
      })
    }
  }, [countingItem])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const updatedItem = {
        ...countingItem,
        countedWarehouse: Number(formData.warehouseStock),
        countedShelf: Number(formData.shelfStock),
        note: formData.note
      }

      onUpdate(updatedItem)
      onClose()
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
            Sayım Detayları - {countingItem?.productName}
          </h3>

          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Depo Stok Miktarı
              </label>
              <input
                type="number"
                min="0"
                value={formData.warehouseStock}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouseStock: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Mevcut: {countingItem?.warehouseStock} {countingItem?.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Raf Stok Miktarı
              </label>
              <input
                type="number"
                min="0"
                value={formData.shelfStock}
                onChange={(e) => setFormData(prev => ({ ...prev, shelfStock: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Mevcut: {countingItem?.shelfStock} {countingItem?.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Not
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Sayım ile ilgili açıklama ekleyin"
              />
            </div>

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

export default CountingModal 