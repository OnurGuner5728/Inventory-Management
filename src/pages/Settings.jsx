import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useSupabase } from '../context/SupabaseContext'
import { createClient } from '@supabase/supabase-js'
import SqlInstructions from '../components/SqlInstructions'
import { supabase } from '../utils/supabase'

const showToast = (type, message, options = {}) => {
  return new Promise((resolve) => {
    toast[type](message, {
      position: "top-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
      ...options,
      onClose: () => {
        options?.onClose?.()
        resolve()
      }
    })
  })
}

const Settings = () => {
  const { isConfigured, initializeClient, setIsConfigured } = useSupabase()
  const [formData, setFormData] = useState({ 
    supabaseUrl: localStorage.getItem('SUPABASE_URL') || '',
    supabaseAnonKey: localStorage.getItem('SUPABASE_ANON_KEY') || ''
  })
  const [loading, setLoading] = useState(false)
  const [showSqlInstructions, setShowSqlInstructions] = useState(false)
  const mountedRef = useRef(true)
  const [editingConnection, setEditingConnection] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const isFormDisabled = loading || (isConfigured && !editingConnection)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!/^https:\/\/.+\.supabase\.co$/.test(formData.supabaseUrl)) {
      toast.error('Geçersiz URL formatı')
      setFormData({ supabaseUrl: '', supabaseAnonKey: '' })
      return
    }
    if (!formData.supabaseAnonKey.startsWith('eyJ')) {
      toast.error('Geçersiz Anon Key formatı')
      setFormData({ supabaseUrl: '', supabaseAnonKey: '' })
      return
    }

    setLoading(true)
    try {
      await initializeClient(formData.supabaseUrl, formData.supabaseAnonKey)
      toast.success('Bağlantı başarılı')
      setShowSqlInstructions(false)
    } catch (error) {
      if (error.message === 'TABLES_NOT_FOUND') {
        toast.error('Veritabanı tabloları bulunamadı')
        setShowSqlInstructions(true)
      } else {
        toast.error('Bağlantı başarısız')
        setShowSqlInstructions(true)
      }
      setFormData({ supabaseUrl: '', supabaseAnonKey: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    if (!isConfigured) {
      showToast('warning', 'Henüz bağlantı kurulmamış')
      return
    }
    setShowConfirmDialog(true)
    localStorage.removeItem('SUPABASE_URL')
    localStorage.removeItem('SUPABASE_ANON_KEY')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="p-4" data-cy="settings-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" data-cy="settings-page-title">
          {isConfigured ? 'Ayarlar' : 'İlk Kurulum'}
        </h1>

        {showSqlInstructions && !isConfigured ? (
          <SqlInstructions 
            onRetry={() => {
              setShowSqlInstructions(false)
              setFormData({ supabaseUrl: '', supabaseAnonKey: '' })
            }}
          />
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Veritabanı Bağlantısı</h2>
              
              {isConfigured && (
                <button
                  data-cy="disconnect-button"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-800"
                >
                  Bağlantıyı Kes
                </button>
              )}
            </div>
           
                Bu sayfada, veritabanı bağlantı ayarlarınızı yapılandırabilirsiniz.<br></br>
                <ul className="list-disc ml-6">
                  <li>Bunun için ilk olarak <a href="https://supabase.com" className="text-blue-400 hover:text-blue-700" target="_blank" rel="noopener noreferrer">Supabase.com</a> adresine gidip, tercih ettiğiniz bir plan seçin (ücretsiz plan da kullanılabilir).</li>
                  <li>Projenizi oluşturun ve proje ayarlarından API adresini ve anon key'ini kopyalayın.</li>
                  <li>Supabase'de gerekli tabloları oluşturmak için "SQL kodu göster" butonuna tıklayın, açılan sayfadaki talimatları takip edin ve sayfanın en altındaki "Tekrar Dene" butonuna tıklayın.</li>
                  <li>Tekrar dene butonu ile mevcut ekrana geri dönün.</li>
                  <li>Doğru bilgileri girip kaydet butonuna tıklayın.</li>
                </ul>
                
              
            <form onSubmit={handleSubmit} className="space-y-4" data-cy="settings-page-connection-settings-form">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supabase URL
                </label>
                <input
                  type="text"
                  name="supabaseUrl"
                  value={formData.supabaseUrl}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${isFormDisabled ? 'bg-gray-100' : ''}`}
                  placeholder="https://your-project.supabase.co"
                  required
                  disabled={isFormDisabled}
                  data-cy="settings-page-connection-settings-form-input url"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  name="supabaseAnonKey"
                  value={formData.supabaseAnonKey}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${isFormDisabled ? 'bg-gray-100' : ''}`}
                  placeholder="your-anon-key"
                  required
                  disabled={isFormDisabled}
                  data-cy="settings-page-connection-settings-form-input key"
                  autoComplete="current-password"
                />
              </div>

              <div data-cy="error-message" className={`${error ? 'block' : 'hidden'} text-red-600`}>
                {error}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isFormDisabled 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  disabled={isFormDisabled}
                  data-cy="settings-page-connection-settings-form-button"
                >
                  {loading ? 'Bağlantı Test Ediliyor...' : (isConfigured ? 'Kaydet' : 'Kurulumu Tamamla')}
                </button>
              </div>
            </form>

            {!isConfigured && !showSqlInstructions && (
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowSqlInstructions(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  data-cy="show-sql-code-button"
                >
                  Tabloları eklemek için SQL kodu göster
                </button>
              </div>
            )}

            {isConfigured && !editingConnection && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md flex flex-col gap-2">
                <p className="text-yellow-700">
                  Bağlantı ayarları zaten yapılandırıldı. Ayarları değiştirmek için "Bağlantı Ayarlarını Değiştir" butonuna tıklayın.
                </p>
                <button
                  onClick={() => setEditingConnection(true)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
                  data-cy="settings-page-edit-connection-button"
                >
                  Bağlantı Ayarlarını Değiştir
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <div
          data-cy="confirm-disconnect"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white p-6 rounded-md">
            <p className="text-sm mb-4">
              Veritabanı bağlantısını kesmek istediğinize emin misiniz? Bu işlem uygulamayı yeniden başlatacaktır.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsConfigured(false)
                  localStorage.removeItem('SUPABASE_URL')
                  localStorage.removeItem('SUPABASE_ANON_KEY')
                
                    window.location.reload()
                
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Evet
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Hayır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings