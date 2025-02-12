import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { categoryOperations, subCategoryOperations, productOperations, stockMovementOperations, supplierOperations, unitOperations } from '../utils/supabase'
import { toast } from 'react-toastify'

const RealtimeContext = createContext()

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

  const addProduct = async (productData) => {
    try {
      const savedProduct = await productOperations.add(productData)
      toast.success('Ürün başarıyla eklendi')
      return savedProduct
    } catch (error) {
      toast.error('Ürün eklenirken hata oluştu')
      throw error
    }
  }

  const updateProduct = async (id, productData) => {
    try {
      // Gelen veriyi kontrol edelim
      console.log('RealtimeContext - Güncelleme verisi:', productData)

      const updatedProduct = await productOperations.update(id, {
        ...productData,
        // Barkod değerini açıkça belirtelim
        barcode: productData.barcode,
        updated_at: new Date().toISOString()
      })

      // State'i güncelle
      setRealtimeData(prev => ({
        ...prev,
        products: prev.products.map(prod => 
          prod.id === id 
            ? { ...prod, ...updatedProduct }
            : prod
        )
      }))

      toast.success('Ürün başarıyla güncellendi')
      return updatedProduct
    } catch (error) {
      console.error('RealtimeContext - Ürün güncellenirken hata:', error)
      toast.error('Ürün güncellenirken hata oluştu')
      throw error
    }
  }

  const deleteProduct = async (id) => {
    try {
      await productOperations.delete(id)
      // Ürünü direkt state'ten sil
      setRealtimeData(prev => ({
        ...prev,
        products: prev.products.filter(prod => prod.id !== id)
      }))
      toast.success('Ürün başarıyla silindi')
      return true
    } catch (error) {
      toast.error('Ürün silinirken hata oluştu')
      throw error
    }
  }

  const settings = {
    inventory: {
      defaultCurrency: 'TRY',
      defaultVatRate: 18
    }
  }

  return (
    <RealtimeContext.Provider value={{
      ...realtimeData,
      addCategory,
      updateCategory,
      deleteCategory,
      addSubCategory,
      updateSubCategory,
      deleteSubCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      settings,
      refetchData: fetchInitialData
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime hook\'u RealtimeProvider içinde kullanılmalıdır')
  }
  return context
} 