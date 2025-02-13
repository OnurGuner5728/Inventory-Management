import React, { useState, useRef, useEffect, useCallback } from 'react'

import { chatService } from '../services/chatService'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useRealtime } from '../context/RealtimeContext' // RealtimeContext'i import edelim
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi'
import { RiRobot2Fill } from 'react-icons/ri'
import { supabase } from '../utils/supabase'

// AIChat bileşeni; bu bileşeni ana sayfa veya layout içerisine ekleyerek test amaçlı kullanabilirsiniz.
// Bu örnekte, props üzerinden ilgili modal açma fonksiyonları alınabilir. Örneğin:
// onOpenProductModal, onOpenCategoryModal, onOpenStockMovementModal, ... gibi.
const AIChat = (props) => {
  const [messages, setMessages] = useState([])         // Sohbet mesajlarını tutar.
  const [input, setInput] = useState('')                // Kullanıcı inputunu tutar.
  const [customCommands, setCustomCommands] = useState({})// Öğrenilmiş (custom) komutları tutar.
  const [pendingCommand, setPendingCommand] = useState(null) // Öğrenilmek istenen komut bilgisi beklemede.
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const { 
    addCategory, updateCategory, deleteCategory,
    addSubCategory, updateSubCategory, deleteSubCategory,
    addProduct, updateProduct, deleteProduct,
    addSupplier, updateSupplier, deleteSupplier,
    settings, refetchData: fetchInitialData 
  } = useRealtime()
  const [windowSize, setWindowSize] = useState('normal') // 'minimized', 'normal', 'maximized'
  const [learnedCommands, setLearnedCommands] = useState({})

  // Session başlatma ve yönetimi için useEffect güncellemesi
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Mevcut session kontrolü
        const currentSessionId = localStorage.getItem('chatSessionId')

        if (!currentSessionId) {
          // Yeni session oluştur
          const sessionId = await chatService.createSession()
          localStorage.setItem('chatSessionId', sessionId)
        } else {
          // Mevcut session'ın geçerliliğini kontrol et
          const { data: sessionExists } = await supabase
            .from('chat_sessions')
            .select('session_id')
            .eq('session_id', currentSessionId)
            .single()

          if (!sessionExists) {
            // Session bulunamadıysa yeni oluştur
            const sessionId = await chatService.createSession()
            localStorage.setItem('chatSessionId', sessionId)
          }
        }

        // Öğrenilmiş komutları yükle
        await loadLearnedCommands()
      } catch (error) {
        console.error('Session başlatma hatası:', error)
        toast.error('Oturum başlatılamadı')
      }
    }

    initializeSession()
  }, [])

  // Öğrenilmiş komutları yükle
  const loadLearnedCommands = async () => {
    try {
      const commands = await chatService.getLearnedCommands()
      const commandMap = commands.reduce((acc, cmd) => ({
        ...acc,
        [cmd.trigger]: cmd.action
      }), {})
      setLearnedCommands(commandMap)
    } catch (error) {
      console.error('Öğrenilmiş komutlar yüklenemedi:', error)
    }
  }

  // Mesaj kaydetme fonksiyonunu güncelle
  const saveMessage = async (message) => {
    try {
      if (!message?.text || typeof message.text !== 'string') {
        console.warn('Geçersiz mesaj formatı:', message)
        return
      }

      const sessionId = localStorage.getItem('chatSessionId')
      if (!sessionId) {
        throw new Error('Geçerli bir oturum bulunamadı')
      }

      const messageData = {
        session_id: sessionId,
        sender: message.sender,
        message: message.text,
        context: message.context || {},
        command_type: message.commandType || null,
        command_params: message.commandParams || null,
        created_at: new Date().toISOString()
      }

      const { data, error } = await chatService.saveChat(messageData)
      if (error) throw error
      return data
    } catch (error) {
      console.error('Mesaj kaydedilemedi:', error)
      if (error.code === '23503') {
        localStorage.removeItem('chatSessionId')
        const newSessionId = await chatService.createSession()
        localStorage.setItem('chatSessionId', newSessionId)
        return await chatService.saveChat({
          ...message,
          session_id: newSessionId
        })
      }
    }
  }

  // Sistem mesajı ekleme fonksiyonu güncellendi
  const addSystemMessage = async (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('Geçersiz sistem mesajı:', text)
      return
    }
    const message = { 
      sender: 'Sistem', 
      text: text.toString(), 
      timestamp: new Date(),
      commandType: 'SYSTEM',
      commandParams: null
    }
    setMessages(prev => [...prev, message])
    await saveMessage(message)
  }

  // Kullanıcı mesajı ekleme fonksiyonu güncellendi
  const addUserMessage = async (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('Geçersiz kullanıcı mesajı:', text)
      return
    }
    const message = { 
      sender: 'Kullanıcı', 
      text: text.toString(), 
      timestamp: new Date(),
      commandType: 'USER',
      commandParams: null
    }
    setMessages(prev => [...prev, message])
    await saveMessage(message)
  }

  // Öğrenme modu işlemleri
  const handleLearning = async (userInput) => {
    if (userInput.toLowerCase().includes('öğren') || userInput.toLowerCase().includes('kaydet')) {
      const match = userInput.match(/öğren:\s*"([^"]+)"\s*->?\s*"([^"]+)"/)
      if (match) {
        const [_, trigger, action] = match
        await chatService.saveLearnedCommand({
          trigger: trigger.toLowerCase(),
          action,
          description: `"${trigger}" komutu geldiğinde "${action}" işlemini yap`
        })
        await addSystemMessage(`Yeni komut öğrenildi! "${trigger}" -> "${action}"`)
        await loadLearnedCommands()
        return true
      }
    }
    return false
  }

  // Geçmiş sorgulama
  const handleHistoryQuery = async (userInput) => {
    if (userInput.toLowerCase().includes('son konuşma') ||
      userInput.toLowerCase().includes('geçmiş')) {
      const recentChats = await chatService.getRecentChats()
      const summary = recentChats
        .map(chat => `${chat.sender}: ${chat.text}`)
        .join('\n')
      await addSystemMessage(`Son konuşmalar:\n${summary}`)
      return true
    }
    return false
  }

  // AI yanıt işleme fonksiyonu güncellendi
  const processAIResponse = async (userInput) => {
    if (!userInput || typeof userInput !== 'string') {
      console.warn('Geçersiz kullanıcı girişi:', userInput)
      return
    }

    setIsLoading(true)
    try {
      await addUserMessage(userInput)

      const result = await chatService.processNaturalLanguage(userInput, {
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        addSubCategory,
        updateSubCategory,
        deleteSubCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        settings,
        navigate,
        handleModalOpen
      })

      if (result?.success) {
        if (result.action) {
          switch (result.action.type) {
            case 'navigation':
              navigate(result.action.path)
              await addSystemMessage(`"${result.action.path}" sayfasına yönlendiriliyorsunuz.`)
              break
            case 'modal':
              handleModalOpen(result.action.modalType)
              await addSystemMessage(`${result.action.modalType} modalı açılıyor.`)
              break
            default:
              console.warn('Bilinmeyen eylem türü:', result.action.type)
          }
        }
        
        if (result.message && typeof result.message === 'string') {
          await addSystemMessage(result.message)
        }
      } else {
        const errorMessage = result?.message || 'Bilinmeyen bir hata oluştu'
        await addSystemMessage('Üzgünüm, bir hata oluştu: ' + errorMessage)
      }

    } catch (error) {
      console.error('İşlem hatası:', error)
      await addSystemMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle fonksiyonları
  const toggleMinimize = () => {
    setWindowSize(current => current === 'minimized' ? 'normal' : 'minimized')
  }

  const toggleSize = () => {
    setWindowSize(current => {
      switch (current) {
        case 'minimized':
          return 'normal'
        case 'normal':
          return 'maximized'
        case 'maximized':
          return 'normal'
        default:
          return 'normal'
      }
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatResponse = (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('Geçersiz mesaj formatı:', text)
      return null
    }
    
    try {
      return text.split('\n').map((line, i) => (
        <p key={i} className={`mb-1 ${i === 0 ? 'font-semibold' : ''}`}>{line}</p>
      ))
    } catch (error) {
      console.error('Mesaj biçimlendirme hatası:', error)
      return <p className="mb-1">{text}</p>
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    addSystemMessage(`"${path}" sayfasına yönlendirildiniz.`)
  }

  const handleModalOpen = (modalType) => {
    const modalHandlers = {
      'ürün': props.onOpenProductModal,
      'kategori': props.onOpenCategoryModal,
      'stok': props.onOpenStockMovementModal,
      'sayım': props.onOpenStockCountingModal,
      'tedarikçi': props.onOpenSupplierModal,
      'birim': props.onOpenUnitModal
    }

    const handler = modalHandlers[modalType]
    if (handler) {
      handler()
      addSystemMessage(`${modalType} modalı açıldı.`)
    }
  }

  // Form submit edilince çalışacak handler (async olarak güncellendi):
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userInput = input.trim()
    setInput('')
    await processAIResponse(userInput)

  }

  return (
    <div 
      className={`fixed bottom-5 right-5 bg-white rounded-lg shadow-xl border border-gray-200 
        overflow-hidden transition-all duration-300 z-50 ${
        windowSize === 'minimized' 
          ? 'w-14 h-14 rounded-full bg-indigo-600 cursor-pointer hover:bg-indigo-700' 
          : windowSize === 'maximized' 
            ? 'w-3/4 h-[80vh]' 
            : 'w-96 h-[32rem]'
      }`}
    >
      {windowSize === 'minimized' ? (
        <div 
          onClick={toggleMinimize}
          className="w-full h-full flex items-center justify-center text-red-500 border-2 border-red-500 square-full"
          title="AI Asistan'ı Aç"
        >
          <RiRobot2Fill size={24} className="animate-pulse" />
        </div>
      ) : (
        <>
          <div className="p-4 bg-indigo-600 text-white flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <RiRobot2Fill size={20} />
              <h3 className="font-semibold text-lg">AI Asistan</h3>
            </div>
            <div className="flex items-center gap-4">
              {isLoading && (
                <span className="animate-pulse text-sm whitespace-nowrap">Düşünüyor...</span>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMinimize}
                  className="p-1.5 hover:bg-indigo-700 rounded transition-colors duration-200"
                  title="Simge Durumuna"
                >
                  <RiRobot2Fill size={18} />
                </button>
                <button
                  onClick={toggleSize}
                  className="p-1.5 hover:bg-indigo-700 rounded transition-colors duration-200"
                  title={windowSize === 'maximized' ? 'Küçült' : 'Büyüt'}
                >
                  {windowSize === 'maximized' ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div 
            className={`${
              windowSize === 'maximized' 
                ? 'h-[calc(80vh-8rem)]' 
                : 'h-[calc(32rem-8rem)]'
            } overflow-y-auto p-4 bg-gray-50`}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 ${msg.sender === 'Kullanıcı' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    msg.sender === 'Kullanıcı'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  {formatResponse(msg.text)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex space-x-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nasıl yardımcı olabilirim?"
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none overflow-y-auto min-h-[2.5rem] max-h-24"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                     
                    }
                  }}
                  style={{
                    height: 'auto',
                    overflowY: 'auto'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0 transition-colors duration-200"
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default AIChat 