import { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  categoryOperations,
  subCategoryOperations,
  productOperations,
  stockMovementOperations,
  supplierOperations,
  unitOperations,
  settingsOperations
} from '../utils/supabase'

const DataContext = createContext()

const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    categories: [],
    products: [],
    stockMovements: [],
    suppliers: [],
    units: [],
    settings: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // İlk yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          categories,
          products,
          stockMovements,
          suppliers,
          units,
          settings
        ] = await Promise.all([
          categoryOperations.getAll(),
          productOperations.getAll(),
          stockMovementOperations.getAll(),
          supplierOperations.getAll(),
          unitOperations.getAll(),
          settingsOperations.get()
        ])

        setData({
          categories,
          products,
          stockMovements,
          suppliers,
          units,
          settings
        })
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  if (error) {
    return <div>Hata: {error.message}</div>
  }

  const generateBarcode = () => {
    const prefix = '869' // Türkiye ülke kodu
    const timestamp = Date.now().toString().slice(-9)
    const randomDigit = Math.floor(Math.random() * 10)
    const barcode = prefix + timestamp + randomDigit

    // Check digit hesaplama (EAN-13)
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10

    return barcode + checkDigit
  }

  const findProductByBarcode = (barcode) => {
    return data.products.find(p => p.barcode === barcode)
  }

  const addProduct = async (productData) => {
    try {
      const savedProduct = await productOperations.add(productData)
      
      setData(prev => ({
        ...prev,
        products: [...prev.products, savedProduct]
      }))

      // Stok hareketi oluştur
      if (productData.stock_warehouse > 0 || productData.stock_shelf > 0) {
        const totalStock = Number(productData.stock_warehouse) + Number(productData.stock_shelf)
        const stockMovementData = {
          type: 'IN',
          product_id: savedProduct.id,
          quantity: totalStock,
          unit_id: savedProduct.unit_id,
          unit_amount: savedProduct.unit_amount || 1,
          price: savedProduct.price_buying || 0,
          total_price: (savedProduct.price_buying || 0) * totalStock,
          vat_rate: savedProduct.vat_rate || 0,
          vat_amount: ((savedProduct.price_buying || 0) * totalStock * (savedProduct.vat_rate || 0)) / 100,
          document_no: `GIR-${new Date().getFullYear()}-${String(data.stockMovements.length + 1).padStart(4, '0')}`,
          description: 'İlk stok girişi',
          source_type: 'SUPPLIER',
          source_id: String(savedProduct.supplier_id || ''),
          source_name: data.suppliers.find(s => s.id === savedProduct.supplier_id)?.name || 'Bilinmiyor',
          destination_type: 'WAREHOUSE',
          destination_location: 'MAIN',
          created_by: 'SYSTEM',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        }

        const savedMovement = await stockMovementOperations.add(stockMovementData)
        
        setData(prev => ({
          ...prev,
          stockMovements: [...prev.stockMovements, savedMovement]
        }))
      }

      return savedProduct
    } catch (error) {
      console.error('Ürün eklenirken hata oluştu:', error)
      throw error
    }
  }

  const updateProduct = async (id, productData, options = {}) => {
    const { skipStockMovement = false } = options;
    try {
      console.log('DataContext - Güncelleme başlıyor:', { id, productData })
      
      const existingProduct = data.products.find(p => p.id === id)
      if (!existingProduct) {
        throw new Error('Ürün bulunamadı')
      }

      const stockDifference = 
        (Number(productData.stock_warehouse || 0) + Number(productData.stock_shelf || 0)) - 
        (Number(existingProduct.stock_warehouse || 0) + Number(existingProduct.stock_shelf || 0))
      
      console.log('DataContext - Stok farkı:', stockDifference)

      // Sayısal alanları dönüştür
      const processedData = {
        ...productData,
        unit_amount: Number(productData.unit_amount || 1),
        stock_warehouse: Number(productData.stock_warehouse || 0),
        stock_shelf: Number(productData.stock_shelf || 0),
        stock_min_level: Number(productData.stock_min_level || 0),
        stock_max_level: Number(productData.stock_max_level || 0),
        price_buying: Number(productData.price_buying || 0),
        price_selling: Number(productData.price_selling || 0),
        vat_rate: Number(productData.vat_rate || 0),
        category_id: Number(productData.category_id),
        sub_category_id: Number(productData.sub_category_id),
        unit_id: Number(productData.unit_id),
        supplier_id: Number(productData.supplier_id),
        updated_at: new Date().toISOString()
      }

      const updatedProduct = await productOperations.update(id, processedData)
      console.log('DataContext - Ürün güncellendi:', updatedProduct)

      setData(prev => ({
        ...prev,
        products: prev.products.map(product =>
          product.id === id ? updatedProduct : product
        )
      }))

      if (!skipStockMovement && stockDifference !== 0) {
        console.log('DataContext - Stok hareketi oluşturuluyor')
        const stockMovementData = {
          type: stockDifference > 0 ? 'IN' : 'OUT',
          product_id: updatedProduct.id,
          quantity: Math.abs(stockDifference),
          unit_id: updatedProduct.unit_id,
          unit_amount: updatedProduct.unit_amount || 1,
          price: updatedProduct.price_buying || 0,
          total_price: (updatedProduct.price_buying || 0) * Math.abs(stockDifference),
          vat_rate: updatedProduct.vat_rate || 0,
          vat_amount: ((updatedProduct.price_buying || 0) * Math.abs(stockDifference) * (updatedProduct.vat_rate || 0)) / 100,
          document_no: `${stockDifference > 0 ? 'GIR' : 'CIK'}-${new Date().getFullYear()}-${String(data.stockMovements.length + 1).padStart(4, '0')}`,
          description: 'Ürün güncelleme kaynaklı stok değişimi',
          source_type: stockDifference > 0 ? 'SUPPLIER' : 'WAREHOUSE',
          source_id: stockDifference > 0 ? String(updatedProduct.supplier_id || '') : 'MAIN',
          source_name: stockDifference > 0 ? data.suppliers.find(s => s.id === updatedProduct.supplier_id)?.name || 'Bilinmiyor' : 'Ana Depo',
          destination_type: stockDifference > 0 ? 'WAREHOUSE' : 'SYSTEM',
          destination_location: stockDifference > 0 ? 'MAIN' : 'ADJUSTMENT',
          created_by: 'SYSTEM',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        }

        const savedMovement = await stockMovementOperations.add(stockMovementData)
        console.log('DataContext - Stok hareketi kaydedildi:', savedMovement)
        
        setData(prev => ({
          ...prev,
          stockMovements: [...prev.stockMovements, savedMovement]
        }))
      }

      return updatedProduct
    } catch (error) {
      console.error('DataContext - Ürün güncellenirken hata oluştu:', error)
      throw error
    }
  }

  const deleteProduct = async (id) => {
    try {
      // Ürün mevcut olmayabilir; direkt silme işlemi gerçekleştiriliyor.
      // Önce ürüne ait stok hareketlerini sil
      await stockMovementOperations.deleteByProductId(id)
      // Sonra ürünü sil
      await productOperations.delete(id)
      setData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        stockMovements: prev.stockMovements.filter(sm => sm.product_id !== id)
      }))
      return true
    } catch (error) {
      console.error('Ürün silinirken hata oluştu:', error)
      throw error
    }
  }

  const addCategory = async (categoryData) => {
    try {
      const savedCategory = await categoryOperations.add(categoryData)
      return savedCategory
    } catch (error) {
      console.error('Kategori eklenirken hata oluştu:', error)
      throw error
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const updatedCategory = await categoryOperations.update(id, categoryData)
      return updatedCategory
    } catch (error) {
      console.error('Kategori güncellenirken hata oluştu:', error)
      throw error
    }
  }

  const deleteCategory = async (id) => {
    try {
      await categoryOperations.delete(id)
      return true
    } catch (error) {
      console.error('Kategori silinirken hata oluştu:', error)
      throw error
    }
  }

  const addSubCategory = async (categoryId, subCategoryData) => {
    try {
      const savedSubCategory = await subCategoryOperations.add(categoryId, subCategoryData)
      return savedSubCategory
    } catch (error) {
      console.error('Alt kategori eklenirken hata oluştu:', error)
      throw error
    }
  }

  const updateSubCategory = async (categoryId, subCategoryId, subCategoryData) => {
    try {
      const updatedSubCategory = await subCategoryOperations.update(subCategoryId, subCategoryData)
      return updatedSubCategory
    } catch (error) {
      console.error('Alt kategori güncellenirken hata oluştu:', error)
      throw error
    }
  }

  const deleteSubCategory = async (categoryId, subCategoryId) => {
    try {
      await subCategoryOperations.delete(subCategoryId)
      return true
    } catch (error) {
      console.error('Alt kategori silinirken hata oluştu:', error)
      throw error
    }
  }

  const addStockMovement = async (movementData) => {
    try {
      console.log('DataContext - Stok hareketi ekleniyor:', movementData)

      // Sayısal alanları dönüştür
      const processedData = {
        ...movementData,
        product_id: Number(movementData.product_id),
        quantity: Number(movementData.quantity),
        unit_id: Number(movementData.unit_id),
        unit_amount: Number(movementData.unit_amount || 1),
        price: Number(movementData.price || 0),
        total_price: Number(movementData.total_price || 0),
        vat_rate: Number(movementData.vat_rate || 0),
        vat_amount: Number(movementData.vat_amount || 0),
        created_by: 'SYSTEM',
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      }

      // Eğer hareket, sayım sonrası çıkış (COUNT_SHORTAGE) ise; yani negatif maliyet (zarar) yansıtılacaksa:
      if (processedData.destination_type === 'COUNT_SHORTAGE' && processedData.type === 'OUT') {
        processedData.price = -Math.abs(processedData.price)
        processedData.total_price = -Math.abs(processedData.total_price)
        processedData.vat_amount = -Math.abs(processedData.vat_amount)
        // Açıklama alanına "Zarar" ifadesini ekleyelim (zaten "eksiği" içeren açıklamada eklenmiş olabilir)
        if (!processedData.description.includes('Zarar')) {
          processedData.description += ' - Zarar'
        }
      }

      const savedMovement = await stockMovementOperations.add(processedData)
      console.log('DataContext - Stok hareketi kaydedildi:', savedMovement)

      // Ürün stoğunu güncelle
      const product = data.products.find(p => p.id === processedData.product_id)
      if (product) {
        let stockChange = 0;
        // IN ve RETURN (iade) işlemleri stoğu artırmalı
        if (processedData.type === 'IN' || processedData.type === 'RETURN') {
          stockChange = processedData.quantity;
        } else {
          stockChange = -processedData.quantity;
        }

        const updatedProduct = {
          ...product,
          stock_warehouse: Number(product.stock_warehouse || 0) + stockChange,
          updated_at: new Date().toISOString()
        }

        await productOperations.update(product.id, updatedProduct)
        
        setData(prev => ({
          ...prev,
          products: prev.products.map(p => p.id === product.id ? updatedProduct : p),
          stockMovements: [...prev.stockMovements, savedMovement]
        }))

        // Eğer iade işleminde ürün kullanılmayacaksa, ek olarak fire (waste) işlemi oluştur
        if (processedData.type === 'RETURN' && processedData.isUsable === false) {
          const wasteData = {
            type: 'WASTE',
            product_id: processedData.product_id,
            quantity: processedData.quantity,
            unit_id: processedData.unit_id,
            unit_amount: processedData.unit_amount,
            price: processedData.price,
            total_price: processedData.total_price,
            vat_rate: processedData.vat_rate,
            vat_amount: processedData.vat_amount,
            document_no: `FIRE-${new Date().getFullYear()}-${String(data.stockMovements.length + 1).padStart(4, '0')}`,
            description: 'İade sonrası kullanılmayacak ürün, fire işlemi',
            source_type: 'RETURN',
            source_id: String(processedData.product_id),
            source_name: 'İade',
            destination_type: 'WASTE',
            destination_location: 'DISPOSE',
            created_by: 'SYSTEM',
            status: 'COMPLETED',
            created_at: new Date().toISOString()
          }

          const savedWaste = await stockMovementOperations.add(wasteData);
          // Fire işlemi stoğu düşürdüğü için, ürüne ek fire etkisini işleyelim:
          const finalUpdatedProduct = {
            ...updatedProduct,
            stock_warehouse: Number(updatedProduct.stock_warehouse) - processedData.quantity,
            updated_at: new Date().toISOString()
          }
          await productOperations.update(finalUpdatedProduct.id, finalUpdatedProduct)
          setData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === finalUpdatedProduct.id ? finalUpdatedProduct : p),
            stockMovements: [...prev.stockMovements, savedWaste]
          }))
        }
      }

      return savedMovement
    } catch (error) {
      console.error('Stok hareketi eklenirken hata oluştu:', error)
      throw error
    }
  }

  const addSupplier = async (supplierData) => {
    try {
      const savedSupplier = await supplierOperations.add({
        name: supplierData.name,
        contact_person: supplierData.contact_person,
        email: supplierData.email,
        phone: supplierData.phone,
        address_street: supplierData.address_street,
        address_district: supplierData.address_district,
        address_city: supplierData.address_city,
        address_country: supplierData.address_country,
        address_postal_code: supplierData.address_postal_code,
        tax_office: supplierData.tax_office,
        tax_number: supplierData.tax_number,
        status: supplierData.status
      })
      
      setData(prev => ({
        ...prev,
        suppliers: [...prev.suppliers, savedSupplier]
      }))

      return savedSupplier
    } catch (error) {
      console.error('Tedarikçi eklenirken hata oluştu:', error)
      throw error
    }
  }

  const updateSupplier = async (id, supplierData) => {
    try {
      const updatedSupplier = await supplierOperations.update(id, {
        name: supplierData.name,
        contact_person: supplierData.contact_person,
        email: supplierData.email,
        phone: supplierData.phone,
        address_street: supplierData.address_street,
        address_district: supplierData.address_district,
        address_city: supplierData.address_city,
        address_country: supplierData.address_country,
        address_postal_code: supplierData.address_postal_code,
        tax_office: supplierData.tax_office,
        tax_number: supplierData.tax_number,
        status: supplierData.status
      })
      
      setData(prev => ({
        ...prev,
        suppliers: prev.suppliers.map(supplier =>
          supplier.id === id ? updatedSupplier : supplier
        )
      }))

      return updatedSupplier
    } catch (error) {
      console.error('Tedarikçi güncellenirken hata oluştu:', error)
      throw error
    }
  }

  const deleteSupplier = async (id) => {
    try {
      await supplierOperations.delete(id)
      
      setData(prev => ({
        ...prev,
        suppliers: prev.suppliers.filter(supplier => supplier.id !== id)
      }))

      return true
    } catch (error) {
      console.error('Tedarikçi silinirken hata oluştu:', error)
      throw error
    }
  }

  const addUnit = async (unitData) => {
    try {
      const savedUnit = await unitOperations.add(unitData)
      
      setData(prev => ({
        ...prev,
        units: [...prev.units, savedUnit]
      }))

      return savedUnit
    } catch (error) {
      console.error('Birim eklenirken hata oluştu:', error)
      throw error
    }
  }

  const updateUnit = async (id, unitData) => {
    try {
      const updatedUnit = await unitOperations.update(id, unitData)
      
      setData(prev => ({
        ...prev,
        units: prev.units.map(unit =>
          unit.id === id ? updatedUnit : unit
        )
      }))

      return updatedUnit
    } catch (error) {
      console.error('Birim güncellenirken hata oluştu:', error)
      throw error
    }
  }

  const deleteUnit = async (id) => {
    try {
      await unitOperations.delete(id)
      
      setData(prev => ({
        ...prev,
        units: prev.units.filter(unit => unit.id !== id)
      }))

      return true
    } catch (error) {
      console.error('Birim silinirken hata oluştu:', error)
      throw error
    }
  }

  return (
    <DataContext.Provider
      value={{
        categories: data.categories,
        products: data.products,
        stockMovements: data.stockMovements,
        suppliers: data.suppliers,
        units: data.units,
        settings: data.settings,
        addProduct,
        updateProduct,
        deleteProduct,
        addStockMovement,
        findProductByBarcode,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubCategory,
        updateSubCategory,
        deleteSubCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addUnit,
        updateUnit,
        deleteUnit,
        generateBarcode
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export { DataProvider, useData } 