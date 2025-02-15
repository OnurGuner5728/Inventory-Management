import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import SupplierModal from '../components/SupplierModal'

const Suppliers = () => {
  const { deleteSupplier } = useRealtime()
  const { suppliers } = useRealtime()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [suppliers])

  const handleDelete = async (id) => {
    if (window.confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) {
      try {
        await deleteSupplier(id)
      } catch (error) {
        console.error('Tedarikçi silinirken hata oluştu:', error)
        alert('Tedarikçi silinirken bir hata oluştu')
      }
    }
  }

  // Tedarikçi arama ve filtreleme
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.tax_number?.includes(searchTerm)
  )

  // Telefon numarası formatı
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '-'
    const str = phoneNumber.toString()
    return `0${str.slice(0, 3)} ${str.slice(3, 6)} ${str.slice(6, 8)} ${str.slice(8)}`
  }

  // Vergi numarası formatı
  const formatTaxNumber = (taxNumber) => {
    if (!taxNumber) return '-'
    return taxNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tedarikçiler</h1>
        <button
          onClick={() => {
            setEditingSupplier(null)
            setIsModalOpen(true)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Yeni Tedarikçi Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tedarikçi adı, yetkili kişi, e-posta, telefon veya vergi no ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Tedarikçi Listesi */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firma Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yetkili Kişi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vergi Bilgileri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tedarikçi bulunamadı
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contact_person || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.email && (
                          <div className="mb-1">
                            <a href={`mailto:${supplier.email}`} className="text-indigo-600 hover:text-indigo-900">
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.phone && (
                          <div>
                            <a href={`tel:${supplier.phone}`} className="text-indigo-600 hover:text-indigo-900">
                              {formatPhoneNumber(supplier.phone)}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {supplier.address_street && (
                          <div className="mb-1">{supplier.address_street}</div>
                        )}
                        {supplier.address_district && supplier.address_city && (
                          <div className="mb-1">
                            {supplier.address_district} / {supplier.address_city}
                          </div>
                        )}
                        {supplier.address_postal_code && (
                          <div>{supplier.address_postal_code}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.tax_office && (
                          <div className="mb-1">
                            V.D: {supplier.tax_office}
                          </div>
                        )}
                        {supplier.tax_number && (
                          <div>
                            VKN: {formatTaxNumber(supplier.tax_number)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        supplier.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingSupplier(supplier)
                          setIsModalOpen(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingSupplier={editingSupplier}
      />
    </div>
  )
}

export default Suppliers 