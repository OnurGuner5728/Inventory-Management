import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'

const SupplierModal = ({ isOpen, onClose, editingSupplier }) => {
  const { addSupplier, updateSupplier } = useRealtime()
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address_street: '',
    address_district: '',
    address_city: '',
    address_country: 'Türkiye',
    address_postal_code: '',
    tax_office: '',
    tax_number: '',
    status: 'active'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name || '',
        contact_person: editingSupplier.contact_person || '',
        email: editingSupplier.email || '',
        phone: editingSupplier.phone || '',
        address_street: editingSupplier.address_street || '',
        address_district: editingSupplier.address_district || '',
        address_city: editingSupplier.address_city || '',
        address_country: editingSupplier.address_country || 'Türkiye',
        address_postal_code: editingSupplier.address_postal_code || '',
        tax_office: editingSupplier.tax_office || '',
        tax_number: editingSupplier.tax_number || '',
        status: editingSupplier.status || 'active'
      })
    } else {
      resetForm()
    }
  }, [editingSupplier])

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address_street: '',
      address_district: '',
      address_city: '',
      address_country: 'Türkiye',
      address_postal_code: '',
      tax_office: '',
      tax_number: '',
      status: 'active'
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Firma adı gerekli'
    }

    if (!formData.contact_person?.trim()) {
      newErrors.contact_person = 'Yetkili kişi gerekli'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telefon numarası gerekli'
    }

    if (!formData.tax_office?.trim()) {
      newErrors.tax_office = 'Vergi dairesi gerekli'
    }

    if (!formData.tax_number?.trim()) {
      newErrors.tax_number = 'Vergi numarası gerekli'
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
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData)
      } else {
        await addSupplier(formData)
      }
      
      onClose()
      resetForm()
    } catch (error) {
      console.error('Tedarikçi kaydedilirken hata oluştu:', error)
      setErrors(prev => ({
        ...prev,
        submit: 'Tedarikçi kaydedilirken bir hata oluştu'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          {editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}
        </h2>
        
        {errors.submit && (
          <div className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded">
            {errors.submit}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Firma Adı
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
                Yetkili Kişi
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.contact_person && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
              )}
            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.phone ? 'border-red-500' : ''
                }`}
                placeholder="5XX XXX XX XX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Adres Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Adres
              </label>
              <input
                type="text"
                name="address_street"
                value={formData.address_street}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                İlçe
              </label>
              <input
                type="text"
                name="address_district"
                value={formData.address_district}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Şehir
              </label>
              <input
                type="text"
                name="address_city"
                value={formData.address_city}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ülke
              </label>
              <input
                type="text"
                name="address_country"
                value={formData.address_country}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Posta Kodu
              </label>
              <input
                type="text"
                name="address_postal_code"
                value={formData.address_postal_code}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Vergi Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vergi Dairesi
              </label>
              <input
                type="text"
                name="tax_office"
                value={formData.tax_office}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.tax_office ? 'border-red-500' : ''
                }`}
              />
              {errors.tax_office && (
                <p className="mt-1 text-sm text-red-600">{errors.tax_office}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vergi Numarası
              </label>
              <input
                type="text"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.tax_number ? 'border-red-500' : ''
                }`}
              />
              {errors.tax_number && (
                <p className="mt-1 text-sm text-red-600">{errors.tax_number}</p>
              )}
            </div>
          </div>

          {/* Durum */}
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

          {/* Butonlar */}
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
              {editingSupplier ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupplierModal 