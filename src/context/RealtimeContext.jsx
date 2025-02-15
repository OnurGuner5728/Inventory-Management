import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { categoryOperations, subCategoryOperations, productOperations, stockMovementOperations, supplierOperations, unitOperations } from '../utils/supabase'
import { toast } from 'react-toastify'

const RealtimeContext = createContext({
  categories: [],
  products: [],
  stockMovements: [],
  suppliers: [],
  units: []
})

export const RealtimeProvider = ({ children }) => {
  const [realtimeData, setRealtimeData] = useState({
    categories: [],
    products: [],
    stockMovements: [],
    suppliers: [],
    units: []
  })

  // İlk yükleme için verileri al
  const fetchInitialData = async () => {
    try {
      const [
        categoriesResponse,
        productsResponse,
        stockMovementsResponse,
        suppliersResponse,
        unitsResponse
      ] = await Promise.all([
        categoryOperations.getAll(),
        productOperations.getAll(),
        stockMovementOperations.getAll(),
        supplierOperations.getAll(),
        unitOperations.getAll()
      ])

      setRealtimeData({
        categories: categoriesResponse,
        products: productsResponse,
        stockMovements: stockMovementsResponse,
        suppliers: suppliersResponse,
        units: unitsResponse
      })
    } catch (error) {
      console.error("Realtime veriler çekilirken hata oluştu:", error)
      toast.error("Realtime veriler çekilemedi.")
    }
  }

  // İlk mount anında verileri çekiyoruz, böylece refetchData çağrılarında da güncel state elde edilir
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Added effect to refetch data on window focus (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInitialData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Added polling effect to refetch data every 10 seconds
  /*useEffect(() => {
    const intervalId = setInterval(() => {
      fetchInitialData()
    }, 10000)
    return () => clearInterval(intervalId)
  }, [])*/

  // Realtime subscriptions
  useEffect(() => {
    // Kategoriler için subscription
    const categorySubscription = supabase
      .channel('categories-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Tüm kategorileri yeniden çek
            const { data: categories } = await supabase
              .from('categories')
              .select('*, sub_categories(*)')
              .order('name')

            if (categories) {
              setRealtimeData(prev => ({
                ...prev,
                categories
              }))
            }
          } else if (payload.eventType === 'DELETE') {
            setRealtimeData(prev => ({
              ...prev,
              categories: prev.categories.filter(cat => cat.id !== payload.old.id)
            }))
          }
        })
      .subscribe()

    // Alt kategoriler için subscription
    const subCategorySubscription = supabase
      .channel('sub-categories-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sub_categories' },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // İlgili kategoriyi ve tüm alt kategorilerini yeniden getir
            const { data: updatedCategory } = await supabase
              .from('categories')
              .select('*, sub_categories(*)')
              .eq('id', payload.new.category_id)
              .single();

            if (updatedCategory) {
              setRealtimeData(prev => ({
                ...prev,
                categories: prev.categories.map(cat =>
                  cat.id === updatedCategory.id ? updatedCategory : cat
                )
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            setRealtimeData(prev => ({
              ...prev,
              categories: prev.categories.map(cat => {
                if (cat.id === payload.old.category_id) {
                  return {
                    ...cat,
                    sub_categories: (cat.sub_categories || []).filter(
                      sub => sub.id !== payload.old.id
                    )
                  };
                }
                return cat;
              })
            }));
          }
        })
      .subscribe();

    // Ürünler için subscription
    const productSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          const { data } = await supabase
            .from('products')
            .select('*')
          
          if (data) {
            setRealtimeData(prev => ({
              ...prev,
              products: data
            }))
          }
      })
      .subscribe()

    // Stok hareketleri için subscription
    const stockMovementSubscription = supabase
      .channel('stock-movements-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stock_movements' },
        async () => {
          const { data } = await supabase
            .from('stock_movements')
            .select('*')
          
          if (data) {
            setRealtimeData(prev => ({
              ...prev,
              stockMovements: data
            }))
          }
      })
      .subscribe()

    // Tedarikçiler için subscription
    const supplierSubscription = supabase
      .channel('suppliers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'suppliers' },
        async () => {
          const { data } = await supabase
            .from('suppliers')
            .select('*')
          
          if (data) {
            setRealtimeData(prev => ({
              ...prev,
              suppliers: data
            }))
          }
      })
      .subscribe()

    // Birimler için subscription
    const unitSubscription = supabase
      .channel('units-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'units' },
        async () => {
          const { data } = await supabase
            .from('units')
            .select('*')
          
          if (data) {
            setRealtimeData(prev => ({
              ...prev,
              units: data
            }))
          }
      })
      .subscribe()

    // Cleanup fonksiyonu
    return () => {
      categorySubscription.unsubscribe()
      subCategorySubscription.unsubscribe()
      productSubscription.unsubscribe()
      stockMovementSubscription.unsubscribe()
      supplierSubscription.unsubscribe()
      unitSubscription.unsubscribe()
    }
  }, [])

  // CRUD operations for categories
  const addCategory = async (categoryData) => {
    try {
      const savedCategory = await categoryOperations.add(categoryData)
      toast.success('Kategori başarıyla eklendi')
      return savedCategory
    } catch (error) {
      toast.error('Kategori eklenirken hata oluştu')
      throw error
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const updatedCategory = await categoryOperations.update(id, categoryData)
      // Kategoriyi direkt state'te güncelle
      setRealtimeData(prev => ({
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === id 
            ? { ...cat, ...updatedCategory }
            : cat
        )
      }))
      toast.success('Kategori başarıyla güncellendi')
      return updatedCategory
    } catch (error) {
      toast.error('Kategori güncellenirken hata oluştu')
      throw error
    }
  }

  const deleteCategory = async (id) => {
    try {
      await categoryOperations.delete(id)
      // Kategoriyi direkt state'ten sil
      setRealtimeData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat.id !== id)
      }))
      toast.success('Kategori başarıyla silindi')
      return true
    } catch (error) {
      toast.error('Kategori silinirken hata oluştu')
      throw error
    }
  }

  const addSubCategory = async (categoryId, subCategoryData) => {
    try {
      const savedSubCategory = await subCategoryOperations.add(categoryId, subCategoryData)
      // Alt kategoriyi direkt state'e ekle
      setRealtimeData(prev => ({
        ...prev,
        categories: prev.categories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                sub_categories: [...(cat.sub_categories || []), savedSubCategory]
              }
            : cat
        )
      }))
      toast.success('Alt kategori başarıyla eklendi')
      return savedSubCategory
    } catch (error) {
      toast.error('Alt kategori eklenirken hata oluştu')
      throw error
    }
  }

  const updateSubCategory = async (categoryId, subCategoryId, subCategoryData) => {
    try {
      const updatedSubCategory = await subCategoryOperations.update(subCategoryId, subCategoryData)
      // Alt kategoriyi direkt state'te güncelle
      setRealtimeData(prev => ({
        ...prev,
        categories: prev.categories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                sub_categories: cat.sub_categories.map(sub =>
                  sub.id === subCategoryId ? updatedSubCategory : sub
                )
              }
            : cat
        )
      }))
      toast.success('Alt kategori başarıyla güncellendi')
      return updatedSubCategory
    } catch (error) {
      toast.error('Alt kategori güncellenirken hata oluştu')
      throw error
    }
  }

  const deleteSubCategory = async (categoryId, subCategoryId) => {
    try {
      await subCategoryOperations.delete(subCategoryId)
      // Alt kategoriyi direkt state'ten sil
      setRealtimeData(prev => ({
        ...prev,
        categories: prev.categories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                sub_categories: cat.sub_categories.filter(sub => sub.id !== subCategoryId)
              }
            : cat
        )
      }))
      toast.success('Alt kategori başarıyla silindi')
      return true
    } catch (error) {
      toast.error('Alt kategori silinirken hata oluştu')
      throw error
    }
  }

  // === Merged Product CRUD and Helper Functions from DataContext ===
  const generateBarcode = () => {
    const prefix = '869' // Türkiye ülke kodu
    const timestamp = Date.now().toString().slice(-9)
    const randomDigit = Math.floor(Math.random() * 10)
    const barcode = prefix + timestamp + randomDigit
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return barcode + checkDigit
  }

  const findProductByBarcode = (barcode) => {
    return realtimeData.products.find(p => p.barcode === barcode)
  }

  const addProduct = async (productData) => {
    try {
      const savedProduct = await productOperations.add(productData)
      setRealtimeData(prev => ({
        ...prev,
        products: [...prev.products, savedProduct]
      }))
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
          document_no: `GIR-${new Date().getFullYear()}-${String(realtimeData.stockMovements.length + 1).padStart(4, '0')}`,
          description: 'İlk stok girişi',
          source_type: 'SUPPLIER',
          source_id: String(savedProduct.supplier_id || ''),
          source_name: realtimeData.suppliers.find(s => s.id === savedProduct.supplier_id)?.name || 'Bilinmiyor',
          destination_type: 'WAREHOUSE',
          destination_location: 'MAIN',
          created_by: 'SYSTEM',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        }
        const savedMovement = await stockMovementOperations.add(stockMovementData)
        setRealtimeData(prev => ({
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
      const product = realtimeData.products.find(p => p.id === processedData.product_id)
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
        
        setRealtimeData(prev => ({
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
            document_no: `FIRE-${new Date().getFullYear()}-${String(realtimeData.stockMovements.length + 1).padStart(4, '0')}`,
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
          setRealtimeData(prev => ({
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

  const updateProduct = async (id, productData, options = {}) => {
    const { skipStockMovement = false } = options;
    try {
      console.log('RealtimeContext - Ürün güncelleme başlıyor:', { id, productData })
      const existingProduct = realtimeData.products.find(p => p.id === id)
      if (!existingProduct) {
        throw new Error('Ürün bulunamadı')
      }
      const stockDifference = 
        (Number(productData.stock_warehouse || 0) + Number(productData.stock_shelf || 0)) - 
        (Number(existingProduct.stock_warehouse || 0) + Number(existingProduct.stock_shelf || 0))
      console.log('RealtimeContext - Stok farkı:', stockDifference)
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
      console.log('RealtimeContext - Ürün güncellendi:', updatedProduct)
      setRealtimeData(prev => ({
        ...prev,
        products: prev.products.map(product => product.id === id ? updatedProduct : product)
      }))
      if (!skipStockMovement && stockDifference !== 0) {
        console.log('RealtimeContext - Stok hareketi oluşturuluyor')
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
          document_no: `${stockDifference > 0 ? 'GIR' : 'CIK'}-${new Date().getFullYear()}-${String(realtimeData.stockMovements.length + 1).padStart(4, '0')}`,
          description: 'Ürün güncelleme kaynaklı stok değişimi',
          source_type: stockDifference > 0 ? 'SUPPLIER' : 'WAREHOUSE',
          source_id: stockDifference > 0 ? String(updatedProduct.supplier_id || '') : 'MAIN',
          source_name: stockDifference > 0 ? realtimeData.suppliers.find(s => s.id === updatedProduct.supplier_id)?.name || 'Bilinmiyor' : 'Ana Depo',
          destination_type: stockDifference > 0 ? 'WAREHOUSE' : 'SYSTEM',
          destination_location: stockDifference > 0 ? 'MAIN' : 'ADJUSTMENT',
          created_by: 'SYSTEM',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        }
        const savedMovement = await stockMovementOperations.add(stockMovementData)
        console.log('RealtimeContext - Stok hareketi kaydedildi:', savedMovement)
        setRealtimeData(prev => ({
          ...prev,
          stockMovements: [...prev.stockMovements, savedMovement]
        }))
      }
      return updatedProduct
    } catch (error) {
      console.error('RealtimeContext - Ürün güncellenirken hata oluştu:', error)
      throw error
    }
  }

  const deleteProduct = async (id) => {
    try {
      await stockMovementOperations.deleteByProductId(id)
      await productOperations.delete(id)
      setRealtimeData(prev => ({
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

  const handleProductSale = async (cartItems) => {
    try {
      for (const item of cartItems) {
        const product = realtimeData.products.find(p => p.id === item.id);
        if (!product) continue;
        const newStockShelf = Number(product.stock_shelf || 0) - item.quantity;
        if (newStockShelf < 0) {
          throw new Error(`Yetersiz stok: ${product.name}`);
        }
        const updatedProductData = {
          ...product,
          stock_shelf: newStockShelf
        };
        await updateProduct(product.id, updatedProductData, { skipStockMovement: false });
      }
      return true;
    } catch (error) {
      console.error('Satış işlemi sırasında hata:', error);
      throw error;
    }
  }

  const settings = {
    inventory: {
      defaultCurrency: 'TRY',
      defaultVatRate: 18
    }
  }

  // Update provider value to include merged functions
  const value = {
    ...realtimeData,
    generateBarcode,
    findProductByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    handleProductSale,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    addStockMovement,
    settings,
    refetchData: fetchInitialData
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
} 