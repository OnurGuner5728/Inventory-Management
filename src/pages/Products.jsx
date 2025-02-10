import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { useRealtime } from '../context/RealtimeContext'
import ProductModal from '../components/ProductModal'
import Barcode from 'react-barcode'
import {QRCodeSVG} from 'qrcode.react'

const Products = () => {
  const { deleteProduct } = useData()
  const { products, categories, suppliers, units, refetchData } = useRealtime()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [products])

  // Realtime güncellemeleri dinle
  useEffect(() => {
    if (products && products.length > 0) {
      console.log('Realtime ürün güncellemesi:', products)
    }
  }, [products])

  const handleEdit = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      await deleteProduct(id)
      refetchData()
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId)
  }

  const getSubCategory = (categoryId, subCategoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.sub_categories?.find(sc => sc.id === subCategoryId)
  }

  const getSupplier = (supplierId) => {
    return suppliers.find(s => s.id === supplierId)
  }

  const getUnit = (unitId) => {
    return units.find(u => u.id === unitId)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm))
    const matchesCategory = !selectedCategory || product.category_id === Number(selectedCategory)

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>
  }

  return (
    <div className="p-4" data-cy="products-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ürünler ({filteredProducts.length})</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          data-cy="add-product-button"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Yeni Ürün Ekle
        </button>
      </div>

      {/* Filtreler */}
      <div className="grid grid-cols-2 gap-4 mb-4" data-cy="filter-section">
        <input
          type="text"
          placeholder="Ürün adı veya barkod ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2"
          data-cy="search-input"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-3 py-2"
          data-cy="category-select" 
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map(category => (
            <option key={category.id} value={category.id} data-cy={`category-option-${category.id}`}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ürün Tablosu */}
      <div className="overflow-x-auto" data-cy="products-table">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2" data-cy="barcode-header">Barkod</th>
              <th className="border px-4 py-2" data-cy="qr-code-header">QR Kod</th>
              <th className="border px-4 py-2" data-cy="name-header">Ürün Adı</th>
              <th className="border px-4 py-2" data-cy="description-header">Açıklama</th>
              <th className="border px-4 py-2" data-cy="category-header">Kategori</th>
              <th className="border px-4 py-2" data-cy="subcategory-header">Alt Kategori</th>
              <th className="border px-4 py-2" data-cy="unit-header">Birim</th>
              <th className="border px-4 py-2" data-cy="unit-amount-header">Birim Miktar</th>
              <th className="border px-4 py-2" data-cy="total-stock-header">Toplam Stok</th>
              <th className="border px-4 py-2" data-cy="warehouse-stock-header">Depo Stok</th>
              <th className="border px-4 py-2" data-cy="shelf-stock-header">Raf Stok</th>
              <th className="border px-4 py-2" data-cy="min-stock-header">Min. Stok</th>
              <th className="border px-4 py-2" data-cy="max-stock-header">Max. Stok</th>
              <th className="border px-4 py-2" data-cy="shelf-location-header">Raf Konumu</th>
              <th className="border px-4 py-2" data-cy="buying-price-header">Alış Fiyatı</th>
              <th className="border px-4 py-2" data-cy="selling-price-header">Satış Fiyatı</th>
              <th className="border px-4 py-2" data-cy="vat-rate-header">KDV (%)</th>
              <th className="border px-4 py-2" data-cy="supplier-header">Tedarikçi</th>
              <th className="border px-4 py-2" data-cy="expiry-date-header">SKT</th>
              <th className="border px-4 py-2" data-cy="status-header">Durum</th>
              <th className="border px-4 py-2" data-cy="actions-header">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="19" className="text-center py-4" data-cy="no-products-message">
                  Ürün bulunamadı
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2" data-cy="barcode-cell"><Barcode value={product.barcode} /></td>
                  <td className="border px-4 py-2" data-cy="qr-code-cell">
                    <QRCodeSVG value={product.barcode} size={128} />
                  </td>
                  <td className="border px-4 py-2" data-cy="name-cell">{product.name || '-'}</td>
                  <td className="border px-4 py-2" data-cy="description-cell">{product.description || '-'}</td>
                  <td className="border px-4 py-2" data-cy="category-cell">
                    {getCategory(product.category_id)?.name || '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="subcategory-cell">
                    {getSubCategory(product.category_id, product.sub_category_id)?.name || '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="unit-cell">
                    {getUnit(product.unit_id)?.name || '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="unit-amount-cell">
                    {product.unit_amount || '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="total-stock-cell">
                    {(Number(product.stock_warehouse) + Number(product.stock_shelf)) || '0'}
                  </td>
                  <td className="border px-4 py-2" data-cy="warehouse-stock-cell">
                    {product.stock_warehouse || '0'}
                  </td>
                  <td className="border px-4 py-2" data-cy="shelf-stock-cell">
                    {product.stock_shelf || '0'}
                  </td>
                  <td className="border px-4 py-2" data-cy="min-stock-cell">
                    {product.stock_min_level || '0'}
                  </td>
                  <td className="border px-4 py-2" data-cy="max-stock-cell">
                    {product.stock_max_level || '0'}
                  </td>
                  <td className="border px-4 py-2" data-cy="shelf-location-cell">
                    {product.shelf_location || '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="buying-price-cell">
                    {product.price_buying ? 
                      `${Number(product.price_buying).toFixed(2)} ${product.price_currency}` : '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="selling-price-cell">
                    {product.price_selling ? 
                      `${Number(product.price_selling).toFixed(2)} ${product.price_currency}` : '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="vat-rate-cell">
                    {product.vat_rate ? `%${product.vat_rate}` : '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="supplier-cell">
                    {getSupplier(product.supplier_id)?.name || '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="expiry-date-cell">
                    {product.expiry_date ? 
                      new Date(product.expiry_date).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="border px-4 py-2" data-cy="status-cell">
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`} data-cy="status-badge">
                      {product.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="border px-4 py-2" data-cy="actions-cell" >
                    <div className="flex space-x-2" data-cy="actions-buttons">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                        data-cy="edit-product-button"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                        data-cy="delete-product-button"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingProduct={editingProduct}
      />
    </div>
  )
}

export default Products 