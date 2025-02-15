import { useState, useEffect, useRef } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import Barcode from 'react-barcode'
import {QRCodeSVG} from 'qrcode.react'

const ProductModal = ({ isOpen, onClose, editingProduct = null }) => {
  const { generateBarcode } = useRealtime()
  const {
    categories,
    addProduct,
    updateProduct,
    units,
    suppliers,
    settings = {
      inventory: {
        defaultCurrency: 'TRY',
        defaultVatRate: 18
      }
    }
  } = useRealtime()

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    sub_category_id: '',
    sub_category_name: '',
    unit_id: '',
    unit_amount: 1,
    stock_warehouse: 0,
    stock_shelf: 0,
    stock_min_level: 0,
    stock_max_level: 0,
    shelf_location: '',
    price_buying: 0,
    price_selling: 0,
    price_currency: settings?.inventory?.defaultCurrency || 'TRY',
    vat_rate: settings?.inventory?.defaultVatRate || 18,
    supplier_id: '',
    expiry_date: '',
    status: 'active'
  })

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [errors, setErrors] = useState({})
  const [isManualBarcode, setIsManualBarcode] = useState(false)
  const barcodeInputRef = useRef(null)

  useEffect(() => {
    console.log('Mevcut tedarikçiler:', suppliers)
    console.log('Form verisi:', formData)
    
    if (editingProduct) {
      // Kategoriyi bul
      const category = categories.find(c => c.id === editingProduct.category_id)
      const subCategory = category?.sub_categories?.find(sc => sc.id === editingProduct.sub_category_id)
      
      setSelectedCategory(category)

      // Form verilerini ayarla
      setFormData({
        barcode: editingProduct.barcode || '',
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        category_id: editingProduct.category_id || '',
        sub_category_id: editingProduct.sub_category_id || '',
        sub_category_name: subCategory?.name || '',
        unit_id: editingProduct.unit_id || '',
        unit_amount: editingProduct.unit_amount || 1,
        stock_warehouse: editingProduct.stock_warehouse || 0,
        stock_shelf: editingProduct.stock_shelf || 0,
        stock_min_level: editingProduct.stock_min_level || 0,
        stock_max_level: editingProduct.stock_max_level || 0,
        shelf_location: editingProduct.shelf_location || '',
        price_buying: editingProduct.price_buying || 0,
        price_selling: editingProduct.price_selling || 0,
        price_currency: editingProduct.price_currency || settings?.inventory?.defaultCurrency || 'TRY',
        vat_rate: editingProduct.vat_rate || settings?.inventory?.defaultVatRate || 18,
        supplier_id: editingProduct.supplier_id || '',
        expiry_date: editingProduct.expiry_date ? new Date(editingProduct.expiry_date).toISOString().split('T')[0] : '',
        status: editingProduct.status || 'active'
      })

      // Eğer düzenlenen ürünün barcode'u varsa manuel modu aç
      setIsManualBarcode(!!editingProduct.barcode)
    } else {
      resetForm()
    }
  }, [editingProduct, categories, settings, generateBarcode])

  const resetForm = () => {
    setFormData({
      barcode: '',
      name: '',
      description: '',
      category_id: '',
      sub_category_id: '',
      sub_category_name: '',
      unit_id: '',
      unit_amount: 1,
      stock_warehouse: 0,
      stock_shelf: 0,
      stock_min_level: 0,
      stock_max_level: 0,
      shelf_location: '',
      price_buying: 0,
      price_selling: 0,
      price_currency: settings?.inventory?.defaultCurrency || 'TRY',
      vat_rate: settings?.inventory?.defaultVatRate || 18,
      supplier_id: '',
      expiry_date: '',
      status: 'active'
    })
    setSelectedCategory(null)
    setErrors({})
    setIsManualBarcode(false)
  }

  const handleGenerateBarcode = () => {
    // Düzenleme modunda bile barkod üretilebilsin
    setIsManualBarcode(false) // Manuel modu kapat
    const newBarcode = generateBarcode()
    setFormData(prev => ({ ...prev, barcode: newBarcode }))
  }

  const handleManualBarcode = () => {
    setIsManualBarcode(!isManualBarcode)
    if (!isManualBarcode) {
      // Manuel mod açıldığında input'a focus ol
      setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 0)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Barkod için özel kontrol
    if (name === 'barcode') {
      // Sadece sayısal değer ve 13-15 karakter kontrolü
      if (value === '' || (/^\d+$/.test(value) && value.length <= 15)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Barkod kontrolü
    if (isManualBarcode && formData.barcode) {
      if (formData.barcode.length < 13 || formData.barcode.length > 15) {
        newErrors.barcode = 'Barkod 13 ile 15 haneli olmalıdır'
      }
    }
    
    // Zorunlu alan kontrolleri
    if (!formData.name?.trim()) newErrors.name = 'Ürün adı gerekli'
    if (!formData.category_id) newErrors.category_id = 'Kategori seçimi gerekli'
    if (!formData.sub_category_id) newErrors.sub_category_id = 'Alt kategori seçimi gerekli'
    if (!formData.unit_id) newErrors.unit_id = 'Birim seçimi gerekli'
    if (!formData.supplier_id) newErrors.supplier_id = 'Tedarikçi seçimi gerekli'
    if (!formData.shelf_location?.trim()) newErrors.shelf_location = 'Raf konumu gerekli'

    // Sayısal değer kontrolleri
    if (formData.unit_amount <= 0) newErrors.unit_amount = 'Birim miktar 0\'dan büyük olmalı'
    if (formData.stock_warehouse < 0) newErrors.stock_warehouse = 'Depo stoku 0\'dan küçük olamaz'
    if (formData.stock_shelf < 0) newErrors.stock_shelf = 'Raf stoku 0\'dan küçük olamaz'
    if (formData.price_buying < 0) newErrors.price_buying = 'Alış fiyatı 0\'dan küçük olamaz'
    if (formData.price_selling < 0) newErrors.price_selling = 'Satış fiyatı 0\'dan küçük olamaz'
    if (formData.vat_rate < 0 || formData.vat_rate > 100) newErrors.vat_rate = 'KDV oranı 0-100 arasında olmalı'

    // Tarih kontrolü
    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = 'Son kullanma tarihi geçmiş bir tarih olamaz'
    }
    
    // Hataları konsola yazdır
    if (Object.keys(newErrors).length > 0) {
      console.log('Validasyon hataları:', newErrors)
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submit edildi')
    console.log('Editing Product:', editingProduct)
    console.log('Form Data:', formData)
    
    if (!validateForm()) {
      console.log('Form validasyonu başarısız')
      return
    }

    // Yeni ürün verisi
    const { sub_category_name, ...productData } = formData

    // Sayısal değerleri dönüştür
    const processedData = {
      ...productData,
      barcode: formData.barcode || null, // Barkod boşsa null olarak gönder
      unit_amount: Number(productData.unit_amount),
      stock_warehouse: Number(productData.stock_warehouse),
      stock_shelf: Number(productData.stock_shelf),
      stock_min_level: Number(productData.stock_min_level),
      stock_max_level: Number(productData.stock_max_level),
      price_buying: Number(productData.price_buying),
      price_selling: Number(productData.price_selling),
      vat_rate: Number(productData.vat_rate),
      expiry_date: productData.expiry_date ? new Date(productData.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString()
    }

    console.log('Gönderilecek veri:', processedData)

    try {
      if (editingProduct) {
        console.log('Ürün güncelleniyor...')
        await updateProduct(editingProduct.id, processedData)
        console.log('Ürün güncellendi')
      } else {
        console.log('Yeni ürün ekleniyor...')
        await addProduct({
          ...processedData,
          created_at: new Date().toISOString()
        })
        console.log('Yeni ürün eklendi')
      }
      
      onClose()
      resetForm()
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error)
      setErrors(prev => ({
        ...prev,
        submit: 'Ürün kaydedilirken bir hata oluştu'
      }))
    }
  }

  const handleCategoryChange = (e) => {
    const categoryId = Number(e.target.value)
    const category = categories.find(c => c.id === categoryId)
    
    setSelectedCategory(category)
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      sub_category_id: '',
      sub_category_name: ''
    }))
  }

  const handleSubCategoryChange = (e) => {
    const subCategoryId = Number(e.target.value)
    const subCategory = selectedCategory?.sub_categories?.find(sc => sc.id === subCategoryId)
    
    setFormData(prev => ({
      ...prev,
      sub_category_id: subCategoryId,
      sub_category_name: subCategory?.name || ''
    }))
  }

  const handleNumericInput = (e) => {
    const { name, value } = e.target
    
    // Boş değer kontrolü
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [name]: 0
      }))
      return
    }

    // Sayısal değer kontrolü
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(0, numValue) // Negatif değerleri 0'a çevir
      }))
    }
  }

  const handleSupplierChange = (e) => {
    const supplierId = Number(e.target.value)
    console.log('Seçilen tedarikçi ID:', supplierId)
    
    const selectedSupplier = suppliers.find(s => s.id === supplierId)
    console.log('Bulunan tedarikçi:', selectedSupplier)
    
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplier_id: supplierId,
        price_currency: selectedSupplier.currency || settings?.inventory?.defaultCurrency || 'TRY'
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        supplier_id: '',
        price_currency: settings?.inventory?.defaultCurrency || 'TRY'
      }))
    }
  }

  const handleStockChange = (e) => {
    const { name, value } = e.target
    
    // Boş değer kontrolü
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [name]: 0
      }))
      return
    }

    // Sayısal değer kontrolü
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(0, numValue) // Negatif değerleri 0'a çevir
      }))
    }
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    
    // Boş değer kontrolü
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [name]: 0
      }))
      return
    }

    // Sayısal değer kontrolü
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(0, numValue) // Negatif değerleri 0'a çevir
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40" data-cy="product-modal">
      <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto relative z-50" data-cy="product-modal-content">
        <h2 className="text-2xl font-bold mb-4" data-cy="product-modal-title">
          {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4" data-cy="product-modal-form">
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" data-cy="product-modal-submit-error">
              {errors.submit}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-barcode-label">
              Barkod
            </label>
            <div className="mt-1 flex space-x-2">
              <input
                ref={barcodeInputRef}
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.barcode ? 'border-red-500' : ''
                }`}
                placeholder="Barkod numarası"
                data-cy="product-modal-barcode-input"
                disabled={!isManualBarcode}
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                  data-cy="product-modal-generate-barcode-button"
                >
                  Otomatik Üret
                </button>
                <button
                  type="button"
                  onClick={handleManualBarcode}
                  className={`px-3 py-2 ${
                    isManualBarcode 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white rounded transition-colors duration-200`}
                  data-cy="product-modal-manual-barcode-button"
                >
                  Manuel Giriş
                </button>
              </div>
            </div>
            {errors.barcode && (
              <p className="text-red-500 text-xs mt-1" data-cy="product-modal-barcode-error">
                {errors.barcode}
              </p>
            )}
            {formData.barcode && (
              <div className="mt-4 flex flex-col md:flex-row justify-center items-center">
                <div className="mr-4 text-center">
                  <p className="text-sm font-medium mb-1">Barkod</p>
                  <Barcode value={formData.barcode} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">QR Kod</p>
                  <QRCodeSVG value={formData.barcode} size={128} />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-name-label">
                Ürün Adı
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-name-input"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-name-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-description-label">
                Açıklama
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                data-cy="product-modal-description-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-category-label">
                Kategori
              </label>
              <select
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleCategoryChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.category_id ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-category-select"
              >
                <option value="">Seçiniz</option>
                {categories && categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-category-error">
                  {errors.category_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-subcategory-label">
                Alt Kategori
              </label>
              <select
                name="sub_category_id"
                value={formData.sub_category_id}
                onChange={handleSubCategoryChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.sub_category_id ? 'border-red-500' : ''
                }`}
                disabled={!selectedCategory}
                data-cy="product-modal-subcategory-select"
              >
                <option value="">Seçiniz</option>
                {selectedCategory?.sub_categories?.map(subCategory => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </option>
                ))}
              </select>
              {errors.sub_category_id && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-subcategory-error">
                  {errors.sub_category_id}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-unit-label">
                Birim
              </label>
              <select
                name="unit_id"
                value={formData.unit_id}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.unit_id ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-unit-select"
              >
                <option value="">Seçiniz</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.unit_id && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-unit-error">
                  {errors.unit_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-unit-amount-label">
                Birim Miktar
              </label>
              <input
                type="number"
                name="unit_amount"
                value={formData.unit_amount}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.unit_amount ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-unit-amount-input"
              />
              {errors.unit_amount && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-unit-amount-error">
                  {errors.unit_amount}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-stock-warehouse-label">
                Depo Stoku
              </label>
              <input
                type="number"
                name="stock_warehouse"
                value={formData.stock_warehouse}
                onChange={handleNumericInput}
                onFocus={(e) => e.target.select()}
                min="0"
                step="1"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.stock_warehouse ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-stock-warehouse-input"
              />
              {errors.stock_warehouse && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-stock-warehouse-error">
                  {errors.stock_warehouse}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-stock-shelf-label">
                Raf Stoku
              </label>
              <input
                type="number"
                name="stock_shelf"
                value={formData.stock_shelf}
                onChange={handleNumericInput}
                onFocus={(e) => e.target.select()}
                min="0"
                step="1"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.stock_shelf ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-stock-shelf-input"
              />
              {errors.stock_shelf && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-stock-shelf-error">
                  {errors.stock_shelf}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-shelf-location-label">
                Raf Konumu
              </label>
              <input
                type="text"
                name="shelf_location"
                value={formData.shelf_location}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.shelf_location ? 'border-red-500' : ''
                }`}
                placeholder="Örn: A-01-02"
                data-cy="product-modal-shelf-location-input"
              />
              {errors.shelf_location && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-shelf-location-error">
                  {errors.shelf_location}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-stock-min-level-label">
                Minimum Stok Seviyesi
              </label>
              <input
                type="number"
                name="stock_min_level"
                value={formData.stock_min_level}
                onChange={handleNumericInput}
                min="0"
                step="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                data-cy="product-modal-stock-min-level-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-stock-max-level-label">
                Maksimum Stok Seviyesi
              </label>
              <input
                type="number"
                name="stock_max_level"
                value={formData.stock_max_level}
                onChange={handleNumericInput}
                min="0"
                step="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                data-cy="product-modal-stock-max-level-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-price-buying-label">
                Alış Fiyatı
              </label>
              <input
                type="number"
                name="price_buying"
                value={formData.price_buying}
                onChange={handleNumericInput}
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.price_buying ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-price-buying-input"
              />
              {errors.price_buying && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-price-buying-error">
                  {errors.price_buying}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-price-selling-label">
                Satış Fiyatı
              </label>
              <input
                type="number"
                name="price_selling"
                value={formData.price_selling}
                onChange={handleNumericInput}
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.price_selling ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-price-selling-input"
              />
              {errors.price_selling && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-price-selling-error">
                  {errors.price_selling}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-vat-rate-label">
                KDV Oranı (%)
              </label>
              <input
                type="number"
                name="vat_rate"
                value={formData.vat_rate}
                onChange={handleNumericInput}
                min="0"
                max="100"
                step="1"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.vat_rate ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-vat-rate-input"
              />
              {errors.vat_rate && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-vat-rate-error">
                  {errors.vat_rate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-supplier-label">
                Tedarikçi
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleSupplierChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.supplier_id ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-supplier-select"
              >
                <option value="">Seçiniz</option>
                {suppliers && suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.phone})
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-supplier-error">
                  {errors.supplier_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-expiry-date-label">
                Son Kullanma Tarihi
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.expiry_date ? 'border-red-500' : ''
                }`}
                data-cy="product-modal-expiry-date-input"
              />
              {errors.expiry_date && (
                <p className="text-red-500 text-xs mt-1 relative z-50" data-cy="product-modal-expiry-date-error">
                  {errors.expiry_date}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" data-cy="product-modal-status-label">
              Durum
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-cy="product-modal-status-select"
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
              data-cy="product-modal-cancel-button"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-cy="product-modal-submit-button"
            >
              {editingProduct ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .form-group select {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group select:focus {
          outline: none;
          border-color: #0066cc;
        }
      `}</style>
    </div>
  )
}

export default ProductModal