import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import UnitModal from '../components/UnitModal'

const Units = () => {
  const { deleteUnit, units } = useRealtime()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (units) {
      setLoading(false)
    }
  }, [units])

  const handleDelete = async (id) => {
    if (window.confirm('Bu birimi silmek istediğinize emin misiniz?')) {
      try {
        await deleteUnit(id)
      } catch (error) {
        console.error('Birim silinirken hata oluştu:', error)
        alert('Birim silinirken bir hata oluştu')
      }
    }
  }

  // Birim arama ve filtreleme
  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Birim tipi seçenekleri
  const unitTypes = [
    { value: 'quantity', label: 'Adet' },
    { value: 'weight', label: 'Ağırlık' },
    { value: 'volume', label: 'Hacim' },
    { value: 'length', label: 'Uzunluk' },
    { value: 'area', label: 'Alan' }
  ]

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Birimler</h1>
        <button
          onClick={() => {
            setEditingUnit(null)
            setIsModalOpen(true)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Yeni Birim Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Birim adı veya kısa adı ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Birim Listesi */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Birim Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kısa Ad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  Birim bulunamadı
                </td>
              </tr>
            ) : (
              filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {unit.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unit.short_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unitTypes.find(type => type.value === unit.type)?.label || unit.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingUnit(unit)
                        setIsModalOpen(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(unit.id)}
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

      <UnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUnit={editingUnit}
      />
    </div>
  )
}

export default Units 