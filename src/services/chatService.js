import { supabase } from '../utils/supabase'

const MAX_RETRIES = 3
const TIMEOUT = 10000
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY

class ChatService {
  constructor() {
    this.SYSTEM_CONTEXT = `
    Sen gelişmiş bir stok yönetim sistemi AI asistanısın. Kullanıcıların doğal dil ile verdikleri komutları anlayıp uygun işlemleri gerçekleştirmeye yardımcı olursun.

    İşlem Yeteneklerin:
    1. Kategori İşlemleri: Ekleme, düzenleme, silme, listeleme
    2. Ürün İşlemleri: Ekleme, düzenleme, silme, stok güncelleme
    3. Stok Hareketleri: Giriş, çıkış, sayım, transfer
    4. Tedarikçi İşlemleri: Ekleme, düzenleme, silme
    5. Raporlama: Stok durumu, hareket geçmişi, analiz

    Önemli Kurallar:
    1. Kullanıcının niyetini anlamaya çalış
    2. Belirsizlik durumunda detay iste
    3. Her işlem sonrası geri bildirim ver
    4. Hataları anlaşılır şekilde açıkla

    Örnek Komutlar:
    - "ürünler sayfasına git" -> Ürünler sayfasına yönlendirir
    - "yeni kategori ekle" -> Kategori ekleme modalını açar
    - "stok girişi yap" -> Stok giriş modalını açar
    - "ürün ekle" -> Ürün ekleme modalını açar
    - "tedarikçi listesine git" -> Tedarikçiler sayfasına yönlendirir
    - "stok sayımı başlat" -> Stok sayım modalını açar
    - "birim ekle" -> Birim ekleme modalını açar
    `

    this.paths = {
      'ürün': '/products',
      'ürünler': '/products',
      'kategori': '/categories',
      'kategoriler': '/categories',
      'stok': '/stock-movements',
      'stok hareket': '/stock-movements',
      'stok hareketleri': '/stock-movements',
      'tedarikçi': '/suppliers',
      'tedarikçiler': '/suppliers',
      'birim': '/units',
      'birimler': '/units',
      'ayarlar': '/settings',
      'anasayfa': '/',
      'dashboard': '/',
      'rapor': '/reports',
      'raporlar': '/reports',
      'analiz': '/analysis'
    }

    this.modalTypes = {
      'ürün': 'product',
      'kategori': 'category',
      'stok': 'stockMovement',
      'stok hareket': 'stockMovement',
      'stok giriş': 'stockMovement',
      'stok çıkış': 'stockMovement',
      'sayım': 'stockCounting',
      'stok sayım': 'stockCounting',
      'tedarikçi': 'supplier',
      'birim': 'unit'
    }

    this.patterns = {
      navigation: {
        patterns: [
          /(?:git|gidelim|aç|göster|navigate|git|gir)\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+(?:sayfası|sayfasına|bölümü|bölümüne|sekmesi|sekmesine)/i,
          /([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+(?:sayfasını|bölümünü|sekmesini)\s+(?:aç|göster)/i,
          /([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+(?:listesi(?:ne)?|sayfası(?:na)?)/i,
          /([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+(?:git|gidelim|aç|göster)/i
        ],
        domain: 'navigation',
        action: 'goto'
      },
      modal: {
        patterns: [
          /(?:yeni|ekle|oluştur)\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)/i,
          /([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+(?:ekle|oluştur|aç)/i,
          /([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+(?:modalı(?:nı)?|penceresi(?:ni)?)\s+(?:aç|göster)/i
        ],
        domain: 'modal',
        action: 'open'
      },
      category: {
        patterns: [
          /kategori\s+(?:ekle|oluştur|kaydet)/i,
          /yeni\s+kategori/i,
          /kategori\s+(?:güncelle|düzenle|sil)/i,
          /kategorinin\s+(?:adını|açıklamasını)\s+(?:değiştir|güncelle)/i,
          /kategoriyi\s+(?:sil|kaldır)/i
        ],
        domain: 'category',
        getAction: (text) => {
          if (text.includes('ekle') || text.includes('oluştur') || text.includes('kaydet') || text.includes('yeni')) return 'create'
          if (text.includes('güncelle') || text.includes('düzenle') || text.includes('değiştir')) return 'update'
          if (text.includes('sil') || text.includes('kaldır')) return 'delete'
          return 'unknown'
        }
      },
      product: {
        patterns: [
          /ürün\s+(?:ekle|oluştur|kaydet)/i,
          /yeni\s+ürün/i,
          /ürün\s+(?:güncelle|düzenle|sil)/i,
          /ürünün\s+(?:bilgilerini|detaylarını|stok|fiyat)\s+(?:güncelle|değiştir)/i,
          /ürünü\s+(?:sil|kaldır)/i,
          /stok\s+(?:güncelle|düzenle|gir|çıkar)/i
        ],
        domain: 'product',
        getAction: (text) => {
          if (text.includes('ekle') || text.includes('oluştur') || text.includes('kaydet') || text.includes('yeni')) return 'create'
          if (text.includes('güncelle') || text.includes('düzenle') || text.includes('değiştir')) return 'update'
          if (text.includes('sil') || text.includes('kaldır')) return 'delete'
          if (text.includes('stok')) return 'stock'
          return 'unknown'
        }
      },
      supplier: {
        patterns: [
          /tedarikçi\s+(?:ekle|oluştur|kaydet)/i,
          /yeni\s+tedarikçi/i,
          /tedarikçi\s+(?:güncelle|düzenle|sil)/i,
          /tedarikçinin\s+(?:bilgilerini|detaylarını)\s+(?:güncelle|değiştir)/i,
          /tedarikçiyi\s+(?:sil|kaldır)/i
        ],
        domain: 'supplier',
        getAction: (text) => {
          if (text.includes('ekle') || text.includes('oluştur') || text.includes('kaydet') || text.includes('yeni')) return 'create'
          if (text.includes('güncelle') || text.includes('düzenle') || text.includes('değiştir')) return 'update'
          if (text.includes('sil') || text.includes('kaldır')) return 'delete'
          return 'unknown'
        }
      },
      unit: {
        patterns: [
          /birim\s+(?:ekle|oluştur|kaydet)/i,
          /yeni\s+birim/i,
          /birim\s+(?:güncelle|düzenle|sil)/i,
          /birimin\s+(?:adını|detaylarını)\s+(?:güncelle|değiştir)/i,
          /birimi\s+(?:sil|kaldır)/i
        ],
        domain: 'unit',
        getAction: (text) => {
          if (text.includes('ekle') || text.includes('oluştur') || text.includes('kaydet') || text.includes('yeni')) return 'create'
          if (text.includes('güncelle') || text.includes('düzenle') || text.includes('değiştir')) return 'update'
          if (text.includes('sil') || text.includes('kaldır')) return 'delete'
          return 'unknown'
        }
      },
      stockMovement: {
        patterns: [
          /stok\s+(?:hareketi|giriş|çıkış)\s+(?:ekle|oluştur|kaydet)/i,
          /yeni\s+stok\s+(?:hareketi|giriş|çıkış)/i,
          /stok\s+(?:sayımı|kontrolü)\s+(?:başlat|yap|oluştur)/i,
          /(?:depoya|rafa)\s+(?:giriş|çıkış|transfer)/i
        ],
        domain: 'stockMovement',
        getAction: (text) => {
          if (text.includes('giriş')) return 'in'
          if (text.includes('çıkış')) return 'out'
          if (text.includes('sayım') || text.includes('kontrol')) return 'count'
          if (text.includes('transfer')) return 'transfer'
          return 'create'
        }
      },
      help: {
        patterns: [
          /(?:yardım|help|komutlar|neler yapabilirsin|nasıl kullanılır)/i,
          /(?:ne yapabilirsin|özellikler|yetenekler)/i
        ],
        domain: 'help',
        action: 'show'
      },
      conversation: {
        patterns: [
          /(?:merhaba|selam|naber|nasılsın)/i,
          /(?:teşekkür|sağol|eyvallah)/i
        ],
        domain: 'conversation',
        action: 'chat'
      }
    }
  }

  async callGeminiAPI(message, retryCount = 0) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: this.SYSTEM_CONTEXT + '\n\nKullanıcı: ' + message + '\nAsistan:' }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After') || Math.pow(2, retryCount)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          return this.callGeminiAPI(message, retryCount + 1)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.candidates[0].content.parts[0].text

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('İstek zaman aşımına uğradı')
      }
      throw error
    }
  }

  async processNaturalLanguage(text, context) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Geçersiz metin girişi')
      }

      // 1. Sohbet kontrolü
      const conversationResponse = await this.handleConversation(text)
      if (conversationResponse) {
        return conversationResponse
      }

      // 2. Yardım kontrolü
      if (text.match(/(?:yardım|help|komutlar|neler yapabilirsin)/i)) {
        return this.showHelp()
      }

      // 3. Öğrenme modu kontrolü
      if (text.toLowerCase().includes('öğren:') || text.toLowerCase().includes('kaydet:')) {
        return await this.handleLearningMode(text)
      }

      // 4. Geçmiş sorgulama kontrolü
      if (text.toLowerCase().includes('son konuşma') || text.toLowerCase().includes('geçmiş')) {
        return await this.handleHistoryQuery()
      }

      // 5. Niyet Analizi
      const intent = await this.analyzeIntent(text)
      if (!intent) {
        return {
          success: false,
          message: 'Üzgünüm, ne yapmak istediğinizi tam olarak anlayamadım. Size nasıl yardımcı olabileceğimi öğrenmek için "yardım" yazabilirsiniz.'
        }
      }

      // 6. Parametre Çıkarımı
      const params = await this.extractParams(text, intent)
      
      // 7. İşlem Yürütme
      const result = await this.executeAction(intent, params, context)
      
      return {
        success: true,
        message: this.formatActionResponse(intent, result),
        action: this.getActionDetails(intent, result)
      }

    } catch (error) {
      console.error('İşlem hatası:', error)
      return {
        success: false,
        message: `Üzgünüm, bir hata oluştu: ${error.message}`
      }
    }
  }

  async handleConversation(text) {
    const greetings = /(?:merhaba|selam|naber|nasılsın)/i
    const thanks = /(?:teşekkür|sağol|eyvallah)/i
    
    if (greetings.test(text)) {
      return {
        success: true,
        message: 'Merhaba! Size nasıl yardımcı olabilirim? Komutları görmek için "yardım" yazabilirsiniz.'
      }
    } else if (thanks.test(text)) {
      return {
        success: true,
        message: 'Rica ederim! Başka bir konuda yardıma ihtiyacınız olursa bana sorabilirsiniz.'
      }
    }
    return null
  }

  showHelp() {
    return {
      success: true,
      message: `Merhaba! İşte yapabildiğim bazı şeyler:

1. Sayfa Yönlendirme:
   - "ürünler sayfasına git"
   - "kategoriler sayfasını aç"
   - "tedarikçiler bölümüne git"

2. Kategori İşlemleri:
   - "kategori ekle adı [isim]"
   - "kategori güncelle [id] yeni adı [isim]"
   - "kategori sil [id]"

3. Ürün İşlemleri:
   - "ürün ekle adı [isim] fiyatı [fiyat] stok [miktar]"
   - "ürün güncelle [id] fiyat [yeni fiyat]"
   - "stok güncelle [ürün adı] yeni stok [miktar]"

4. Tedarikçi İşlemleri:
   - "tedarikçi ekle adı [isim] telefon [numara]"
   - "tedarikçi güncelle [id] telefon [yeni numara]"

5. Birim İşlemleri:
   - "birim ekle adı [isim]"
   - "birim güncelle [id] yeni adı [isim]"

6. Stok Hareketleri:
   - "stok girişi ekle ürün [isim] miktar [sayı]"
   - "stok çıkışı ekle ürün [isim] miktar [sayı]"

7. Diğer:
   - "son konuşmaları göster"
   - "öğren: [komut] -> [eylem]"

Her zaman daha doğal bir dille konuşabilirsiniz. Size yardımcı olmak için elimden geleni yapacağım!`
    }
  }

  formatActionResponse(intent, result) {
    switch (intent.domain) {
      case 'category':
        return `Kategori işlemi başarıyla tamamlandı: ${result.name}`
      case 'product':
        return `Ürün işlemi başarıyla tamamlandı: ${result.name}`
      case 'supplier':
        return `Tedarikçi işlemi başarıyla tamamlandı: ${result.name}`
      case 'unit':
        return `Birim işlemi başarıyla tamamlandı: ${result.name}`
      case 'stockMovement':
        return `Stok hareketi başarıyla kaydedildi`
      case 'navigation':
        return `"${result.path}" sayfasına yönlendiriliyorsunuz`
      default:
        return `İşlem başarıyla tamamlandı: ${JSON.stringify(result)}`
    }
  }

  getActionDetails(intent, result) {
    if (intent.domain === 'navigation') {
      return {
        type: 'navigation',
        path: result.path
      }
    } else if (intent.domain === 'modal') {
      return {
        type: 'modal',
        modalType: result.modalType
      }
    }
    return null
  }

  async analyzeIntent(text) {
    try {
      // Her bir pattern grubunu kontrol et
      for (const [key, group] of Object.entries(this.patterns)) {
        for (const pattern of group.patterns) {
          const match = text.match(pattern)
          if (match) {
            return {
              domain: group.domain,
              action: group.getAction ? group.getAction(text.toLowerCase()) : (group.action || 'unknown'),
              match: match
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error('Niyet analizi hatası:', error)
      return null
    }
  }

  async extractParams(text, intent) {
    const params = {}
    
    switch (intent.domain) {
      case 'category':
        const nameMatch = text.match(/adı\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)(?:\s+açıklama|$)/i) || 
                         text.match(/([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+adında/i)
        const descMatch = text.match(/açıklama(?:sı)?\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)(?:\.|$)/i)

        if (nameMatch) params.name = nameMatch[1].trim()
        if (descMatch) params.description = descMatch[1].trim()
        break

      case 'product':
        const barcodeMatch = text.match(/barkod(?:u)?\s+([0-9]+)/i)
        const productNameMatch = text.match(/adı\s+([a-zA-ZğĞüÜşŞıİöÖçÇ0-9\s]+)(?:\s+(?:fiyat|kategori|açıklama)|$)/i)
        const priceMatch = text.match(/fiyat(?:ı)?\s+([0-9]+(?:\.[0-9]+)?)/i)
        const stockMatch = text.match(/stok(?:u)?\s+([0-9]+)/i)
        const categoryNameMatch = text.match(/kategori(?:si)?\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)(?:\s+(?:fiyat|stok|açıklama)|$)/i)

        if (barcodeMatch) params.barcode = barcodeMatch[1]
        if (productNameMatch) params.name = productNameMatch[1].trim()
        if (priceMatch) params.price_selling = parseFloat(priceMatch[1])
        if (stockMatch) params.stock_warehouse = parseInt(stockMatch[1])
        if (categoryNameMatch) params.category_name = categoryNameMatch[1].trim()
        break

      case 'supplier':
        const supplierNameMatch = text.match(/adı\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)(?:\s+(?:telefon|email|adres)|$)/i)
        const phoneMatch = text.match(/telefon(?:u)?\s+([0-9\s-]+)/i)
        const emailMatch = text.match(/email\s+([a-zA-Z0-9@\.-]+)/i)

        if (supplierNameMatch) params.name = supplierNameMatch[1].trim()
        if (phoneMatch) params.phone = phoneMatch[1].trim()
        if (emailMatch) params.email = emailMatch[1]
        break
    }

    return params
  }

  async executeAction(intent, params, context) {
    if (!intent || !context) {
      throw new Error('Geçersiz parametreler')
    }

    try {
      const actionKey = `${intent.domain}_${intent.action}`
      console.log('Yürütülecek eylem:', actionKey, 'Parametreler:', params)

      // Sayfa yönlendirme işlemleri
      if (intent.domain === 'navigation') {
        const pageName = intent.match[1].toLowerCase().trim()
        
        // Kelime kelime kontrol et
        const words = pageName.split(/\s+/)
        for (let i = 0; i < words.length; i++) {
          const key = words.slice(i).join(' ')
          if (this.paths[key]) {
            context.navigate(this.paths[key])
            return { success: true, path: this.paths[key] }
          }
        }
        
        throw new Error(`"${pageName}" sayfası bulunamadı`)
      }

      // Modal açma işlemleri
      if (intent.domain === 'modal') {
        const modalName = intent.match[1].toLowerCase().trim()
        
        // Kelime kelime kontrol et
        const words = modalName.split(/\s+/)
        for (let i = 0; i < words.length; i++) {
          const key = words.slice(i).join(' ')
          if (this.modalTypes[key]) {
            return { 
              success: true, 
              type: 'modal',
              modalType: this.modalTypes[key]
            }
          }
        }
      }

      // Diğer işlemler
      switch (actionKey) {
        case 'category_create':
          if (!params.name) {
            throw new Error('Kategori adı gerekli')
          }
          return await context.addCategory({
            name: params.name,
            description: params.description || `${params.name} kategorisi`,
            icon: '📦'
          })

        case 'product_create':
          if (!params.name) {
            throw new Error('Ürün adı gerekli')
          }
          const category = await this.findOrCreateCategory(params.category_name, context)
          return await context.addProduct({
            barcode: params.barcode,
            name: params.name,
            category_id: category?.id,
            price_selling: params.price_selling || 0,
            stock_warehouse: params.stock_warehouse || 0,
            status: 'active'
          })

        case 'product_stock':
          const product = await this.findProduct(params.name || params.barcode)
          if (!product) throw new Error('Ürün bulunamadı')
          
          return await context.updateProduct(product.id, {
            stock_warehouse: params.stock_warehouse
          })

        case 'supplier_create':
          if (!params.name) {
            throw new Error('Tedarikçi adı gerekli')
          }
          return await context.addSupplier({
            name: params.name,
            phone: params.phone || '',
            email: params.email || '',
            status: 'active'
          })

        case 'unit_create':
          if (!params.name) {
            throw new Error('Birim adı gerekli')
          }
          return await context.addUnit({
            name: params.name,
            status: 'active'
          })

        default:
          throw new Error(`Bilinmeyen işlem: ${actionKey}`)
      }
    } catch (error) {
      console.error('İşlem yürütme hatası:', error)
      throw error
    }
  }

  async createSession() {
    try {
      const sessionId = `session_${Date.now()}`
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([
          { 
            session_id: sessionId,
            user_id: (await supabase.auth.getUser())?.data?.user?.id,
            is_active: true
          }
        ])
        .select('session_id')
        .single()

      if (error) throw error
      
      return data.session_id
    } catch (error) {
      console.error('Session oluşturma hatası:', error)
      throw error
    }
  }

  async saveChat(message) {
    if (!message?.message || typeof message.message !== 'string') {
      throw new Error('Geçersiz mesaj formatı')
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: message.session_id,
        sender: message.sender,
        message: message.message,
        context: message.context || {},
        command_type: message.command_type || null,
        command_params: message.command_params || null,
        created_at: message.created_at || new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getRecentChats(limit = 10) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', localStorage.getItem('chatSessionId'))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data.reverse()
  }

  async saveLearnedCommand(command) {
    const { data, error } = await supabase
      .from('learned_commands')
      .insert([{
        trigger_pattern: command.trigger,
        action_type: command.actionType,
        action_params: command.params,
        description: command.description
      }])

    if (error) throw error
    return data
  }

  async getLearnedCommands() {
    const { data, error } = await supabase
      .from('learned_commands')
      .select('*')
      .order('usage_count', { ascending: false })

    if (error) throw error
    return data
  }

  async updateCommandUsage(commandId) {
    const { data, error } = await supabase
      .from('learned_commands')
      .update({ 
        usage_count: supabase.raw('usage_count + 1'),
        last_used_at: new Date()
      })
      .eq('id', commandId)

    if (error) throw error
    return data
  }

  async processCommand(command, realtimeContext) {
    const lowerCmd = command.toLowerCase()
    
    const categoryMatch = lowerCmd.match(/kategori (?:ekle|oluştur|yarat)/)
    if (categoryMatch) {
      const nameMatch = command.match(/adı\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)(?:\s+açıklama|$)/i) || 
                       command.match(/([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)\s+adında/i)
      const descMatch = command.match(/açıklama(?:sı)?\s+([a-zA-ZğĞüÜşŞıİöÖçÇ\s]+)(?:\.|$)/i)

      if (nameMatch) {
        const name = nameMatch[1].trim()
        const description = descMatch ? descMatch[1].trim() : ''

        await realtimeContext.addCategory({
          name,
          description,
          icon: '📦'
        })

        return `"${name}" adında yeni bir kategori eklendi, açıklaması "${description}" olarak kaydedildi.`
      }
    }
    
    return null
  }

  async findOrCreateCategory(name, context) {
    if (!name) return null
    
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', name)
      .limit(1)

    if (categories?.length > 0) return categories[0]

    const { data: newCategory } = await context.addCategory({
      name,
      description: `${name} kategorisi`,
      icon: '📦'
    })

    return newCategory
  }

  async findProduct(identifier) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .or(`barcode.eq.${identifier},name.ilike.%${identifier}%`)
      .limit(1)

    return products?.[0]
  }

  async handleLearningMode(text) {
    const match = text.match(/(?:öğren|kaydet):\s*"([^"]+)"\s*->?\s*"([^"]+)"/)
    if (match) {
      const [_, trigger, action] = match
      await this.saveLearnedCommand({
        trigger: trigger.toLowerCase(),
        action,
        description: `"${trigger}" komutu geldiğinde "${action}" işlemini yap`
      })
      return {
        success: true,
        message: `Yeni komut öğrenildi! "${trigger}" -> "${action}"`
      }
    }
    return {
      success: false,
      message: 'Öğrenme komutu doğru formatta değil. Örnek: öğren: "selam" -> "merhaba de"'
    }
  }

  async handleHistoryQuery() {
    try {
      const recentChats = await this.getRecentChats()
      if (!recentChats || recentChats.length === 0) {
        return {
          success: true,
          message: 'Henüz hiç konuşma geçmişi yok.'
        }
      }

      const summary = recentChats
        .map(chat => `${chat.sender}: ${chat.message}`)
        .join('\n')

      return {
        success: true,
        message: `Son konuşmalar:\n${summary}`
      }
    } catch (error) {
      console.error('Geçmiş sorgulama hatası:', error)
      return {
        success: false,
        message: 'Konuşma geçmişi alınırken bir hata oluştu.'
      }
    }
  }
}

export const chatService = new ChatService() 