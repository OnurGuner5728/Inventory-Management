import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { setSupabaseClient } from '../utils/supabase'
import { toast } from 'react-toastify'
const SupabaseContext = createContext()

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const SupabaseProvider = ({ children }) => {
  const [supabase, setSupabase] = useState(null)
  const [globalLoading, setGlobalLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  const clientRef = useRef(null)

  const initializeClient = async (url, key) => {
    try {
      if (clientRef.current) {
        // Supabase client'te removeAllSubscriptions() fonksiyonu bulunmadığı için bu satır kaldırıldı.
      }

      const client = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: { 'apikey': key }
        }
      })

      const settingsResponse = await Promise.race([
        client.from('settings').select('id').limit(1),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Bağlantı zaman aşımına uğradı (5 saniye)')), 5000)
        )
      ])

      if (settingsResponse.error) {
        let errorMessage = '';
        if (settingsResponse.error.code === 'PGRST301') {
          errorMessage = 'Yetkilendirme hatası: API anahtarını kontrol edin';
        } else if (settingsResponse.error.code === '42P01') {
          errorMessage = 'Veritabanı tabloları bulunamadı';
          throw new Error('TABLES_NOT_FOUND');
        } else if (settingsResponse.error.message && settingsResponse.error.message.includes('Failed to fetch')) {
          errorMessage = 'Bağlantı başarısız';
          try {
            await client.auth.signInWithPassword({ email: 'dummy@example.com', password: 'dummy' });
          } catch (authError) {
            // Hata bekleniyor
          }
        } else {
          errorMessage = `Bağlantı hatası: ${settingsResponse.error.message || 'Bilinmeyen hata'}`;
        }
        throw new Error(errorMessage);
      }

      // Ek kontrol: 'categories' tablosunun varlığını kontrol et
      const categoriesResponse = await client.from('categories').select('id').limit(1);
      if (categoriesResponse.error) {
        if (
          categoriesResponse.error.code === '42P01' ||
          (categoriesResponse.error.message && categoriesResponse.error.message.toLowerCase().includes('not found'))
        ) {
          throw new Error('TABLES_NOT_FOUND');
        }
      }

      clientRef.current = client
      setSupabase(client)
      setSupabaseClient(client)
      setIsConfigured(true)
      setGlobalLoading(false)

      // Başarılı bağlantı bilgilerini localStorage'a kaydet
      localStorage.setItem('SUPABASE_URL', url)
      localStorage.setItem('SUPABASE_ANON_KEY', key)

      return true
    } catch (error) {
      console.error('Supabase bağlantısı hatası:', error)
      clientRef.current = null
      setSupabase(null)
      setSupabaseClient(null)
      setIsConfigured(false)
      setGlobalLoading(false)

      // Hata durumunda localStorage'ı temizle
      localStorage.removeItem('SUPABASE_URL')
      localStorage.removeItem('SUPABASE_ANON_KEY')

      if (error.message === 'TABLES_NOT_FOUND') {
        throw new Error('TABLES_NOT_FOUND')
      }
      throw error
    }
  }

  useEffect(() => {
    const initializeSupabase = async () => {
      const url = localStorage.getItem('SUPABASE_URL')
      const key = localStorage.getItem('SUPABASE_ANON_KEY')

      if (!url || !key) {
        setSupabase(null)
        setSupabaseClient(null)
        setIsConfigured(false)
        setGlobalLoading(false)
        return
      }

      try {
        const urlPattern = /^https:\/\/.+\.supabase\.co$/
        if (!urlPattern.test(url)) {
          console.warn('Geçersiz Supabase URL formatı')
          setSupabase(null)
          setSupabaseClient(null)
          setIsConfigured(false)
          setGlobalLoading(false)
          return
        }

        if (!key.startsWith('eyJ')) {
          console.warn('Geçersiz Supabase Anon Key formatı')
          setSupabase(null)
          setSupabaseClient(null)
          setIsConfigured(false)
          setGlobalLoading(false)
          return
        }

        const success = await initializeClient(url, key)
        if (!success) {
          setSupabase(null)
          setSupabaseClient(null)
          setIsConfigured(false)
        }
      } catch (error) {
        console.error('Supabase bağlantısı oluşturulurken hata:', error)
        setSupabase(null)
        setSupabaseClient(null)
        setIsConfigured(false)
      }

      setGlobalLoading(false)
    }

    initializeSupabase()
  }, [])

  const value = {
    supabase,
    globalLoading,
    isConfigured,
    setIsConfigured,
    initializeClient
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export default SupabaseContext 