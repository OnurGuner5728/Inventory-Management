import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'

const UnitModal = ({ isOpen, onClose, editingUnit }) => {
  const { addUnit, updateUnit } = useRealtime()
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    type: 'quantity',
    status: 'active'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editingUnit) {
      setFormData({
        name: editingUnit.name || '',
        short_name: editingUnit.short_name || '',
        type: editingUnit.type || 'quantity',
        status: editingUnit.status || 'active'
      })
    } else {
      resetForm()
    }
  }, [editingUnit])

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      type: 'quantity',
      status: 'active'
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Birim adı gerekli'
    }

    if (!formData.short_name?.trim()) {
      newErrors.short_name = 'Kısa ad gerekli'
    }

    if (!formData.type) {
      newErrors.type = 'Birim tipi gerekli'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, formData)
      } else {
        await addUnit(formData)
      }
      
      onClose()
      resetForm()
    } catch (error) {
      console.error('Birim kaydedilirken hata oluştu:', error)
      setErrors(prev => ({
        ...prev,
        submit: 'Birim kaydedilirken bir hata oluştu'
      }))
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const unitTypes = [
    { value: 'quantity', label: 'Adet' },
    { value: 'weight', label: 'Ağırlık' },
    { value: 'volume', label: 'Hacim' },
    { value: 'length', label: 'Uzunluk' },
    { value: 'area', label: 'Alan' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">
          {editingUnit ? 'Birim Düzenle' : 'Yeni Birim Ekle'}
        </h2>
        
        {errors.submit && (
          <div className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded">
            {errors.submit}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birim Adı
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kısa Ad
            </label>
            <input
              type="text"
              name="short_name"
              value={formData.short_name}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.short_name ? 'border-red-500' : ''
              }`}
            />
            {errors.short_name && (
              <p className="mt-1 text-sm text-red-600">{errors.short_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birim Tipi
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.type ? 'border-red-500' : ''
              }`}
            >
              {unitTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Durum
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editingUnit ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UnitModal 