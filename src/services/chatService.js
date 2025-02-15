import { supabase } from '../utils/supabase'

const MAX_RETRIES = 3
const TIMEOUT = 10000
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY

class ChatService {
  constructor() {
    this.SYSTEM_CONTEXT = `
    Sen gelişmiş bir stok yönetim sistemi AI asistanısın. Adın Asistan ve kişiliğin var.
    Kullanıcılarla doğal ve samimi bir şekilde sohbet edersin. Her soruya aynı kalıp cevapları vermek yerine,
    bağlama uygun, doğal ve çeşitli yanıtlar verirsin.

    Kişilik özelliklerin:
    - Yardımsever ve pozitifsin
    - Türkçe karakterini iyi yansıtırsın (ama resmi değil, samimi bir üslup kullanırsın)
    - Espri yapabilirsin
    - Sohbeti tekdüze olmaktan çıkarırsın
    - Her soruya farklı şekillerde cevap verebilirsin
    - Duygusal zeka gösterirsin

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
    5. Aynı kalıp cevapları tekrar tekrar verme
    6. Doğal bir sohbet akışı sağla

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
          /([a-zA-ZğĞüÜşŞıİöÖçÇ]+)\s+adında\s+kategori\s+(?:ekle|oluştur|kaydet)/i,
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
    // API anahtarını kontrol et
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return null // API anahtarı yoksa direkt null dön
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
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
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()
      return result.candidates[0].content.parts[0].text

    } catch (error) {
      console.warn('Gemini API hatası:', error)
      return null // Hata durumunda null dön
    }
  }

  async processNaturalLanguage(text, context) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Geçersiz metin girişi')
      }

      // Önce basit konuşma kontrolü yapalım
      const conversationResponse = this.handleConversation(text)
      if (conversationResponse) {
        return conversationResponse
      }

      // Alt kategori ekleme işlemi için özel kontrol
      if (text.toLowerCase().includes('alt kategori') && text.toLowerCase().includes('ekle')) {
        const categoryMatch = text.match(/([a-zA-ZğĞüÜşŞıİöÖçÇ]+)(?:'e|'a)\s+([a-zA-ZğĞüÜşŞıİöÖçÇ]+)\s+alt kategori/i) ||
                            text.match(/([a-zA-ZğĞüÜşŞıİöÖçÇ]+)\s+kategorisine\s+([a-zA-ZğĞüÜşŞıİöÖçÇ]+)\s+alt/i)
        
        if (categoryMatch) {
          const [_, parentCategory, subCategory] = categoryMatch
          
          // Ana kategoriyi bulalım
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .ilike('name', parentCategory)
            .limit(1)
          
          if (categories?.length > 0) {
            const parentId = categories[0].id
            await context.addSubCategory(parentId, {
              name: subCategory,
              description: `${subCategory} alt kategorisi`,
              parent_id: parentId
            })
            
            return {
              success: true,
              message: `"${categories[0].name}" kategorisine "${subCategory}" alt kategorisi başarıyla eklendi.`
            }
          } else {
            return {
              success: false,
              message: `"${parentCategory}" isimli kategori bulunamadı.`
            }
          }
        }
      }

      try {
        // Gemini API'den yanıt almayı deneyelim
        const aiResponse = await this.callGeminiAPI(text)
        if (aiResponse) {
          // Niyet analizi yapalım
          const intent = await this.analyzeIntent(text)
          if (intent) {
            // Parametreleri çıkaralım
            const params = await this.extractParams(text, intent)
            
            // İşlemi yürütelim
            const result = await this.executeAction(intent, params, context)
            
            return {
              success: true,
              message: result.message || aiResponse,
              action: result.action
            }
          }
          
          // Intent bulunamadıysa sadece AI yanıtını döndürelim
          return {
            success: true,
            message: aiResponse
          }
        }
      } catch (error) {
        console.warn('Gemini API hatası:', error)
        // API hatası durumunda intent analizi ile devam edelim
      }

      // Niyet analizi yapalım
      const intent = await this.analyzeIntent(text)
      if (!intent) {
        return {
          success: false,
          message: 'Üzgünüm, ne yapmak istediğinizi anlayamadım.'
        }
      }

      // Parametreleri çıkaralım
      const params = await this.extractParams(text, intent)
      
      // İşlemi yürütelim
      const result = await this.executeAction(intent, params, context)
      
      return {
        success: true,
        message: result.message,
        action: result.action
      }

    } catch (error) {
      console.error('İşlem hatası:', error)
      return {
        success: false,
        message: `Üzgünüm, bir hata oluştu: ${error.message}`
      }
    }
  }

  extractActionsFromResponse(response) {
    const actions = []
    
    // Modal açma aksiyonları
    if (response.toLowerCase().includes('modal')) {
      const modalTypes = {
        'ürün': 'product',
        'kategori': 'category',
        'stok': 'stockMovement',
        'sayım': 'stockCounting',
        'tedarikçi': 'supplier',
        'birim': 'unit'
      }

      for (const [key, value] of Object.entries(modalTypes)) {
        if (response.toLowerCase().includes(key)) {
          actions.push({
            type: 'modal',
            modalType: value
          })
          break
        }
      }
    }

    // Sayfa yönlendirme aksiyonları
    for (const [key, path] of Object.entries(this.paths)) {
      if (response.toLowerCase().includes(key)) {
        actions.push({
          type: 'navigation',
          path: path
        })
        break
      }
    }

    // Direkt işlem aksiyonları
    const directActions = {
      'kategori ekle': 'category_create',
      'ürün ekle': 'product_create',
      'stok güncelle': 'product_stock',
      'tedarikçi ekle': 'supplier_create',
      'birim ekle': 'unit_create'
    }

    for (const [key, value] of Object.entries(directActions)) {
      if (response.toLowerCase().includes(key)) {
        actions.push({
          type: 'direct',
          operation: value
        })
        break
      }
    }

    return actions
  }

  async handleConversation(text) {
    const greetings = /(?:merhaba|selam|naber|nasılsın)/i
    const thanks = /(?:teşekkür|sağol|eyvallah)/i
    const identity = /(?:sen kimsin|kendini tanıt|kimsin sen)/i
    
    // Önce yerel yanıtları kontrol et
    let response = null
    if (greetings.test(text)) {
      const responses = [
        'Merhaba! Bugün size nasıl yardımcı olabilirim?',
        'Selam! Hoş geldiniz. Size nasıl destek olabilirim?',
        'Merhabalar! Stok yönetimi konusunda size yardımcı olmak için buradayım.',
        'Selamlar! Sistemle ilgili her konuda yardımcı olmaktan mutluluk duyarım.'
      ]
      response = responses[Math.floor(Math.random() * responses.length)]
    } else if (thanks.test(text)) {
      const responses = [
        'Rica ederim! Başka bir konuda yardıma ihtiyacınız olursa buradayım.',
        'Ne demek, her zaman yardımcı olmaktan mutluluk duyarım!',
        'Rica ederim! Başka sorularınız varsa çekinmeden sorabilirsiniz.',
        'Önemli değil! Size yardımcı olabildiysem ne mutlu bana.'
      ]
      response = responses[Math.floor(Math.random() * responses.length)]
    } else if (identity.test(text)) {
      const responses = [
        'Ben bu stok yönetim sisteminin AI asistanıyım. Size yardımcı olmak için buradayım ve sistemle ilgili her türlü işlemi yapabilirim.',
        'Stok yönetimi konusunda size yardımcı olmak için tasarlanmış bir yapay zeka asistanıyım. Ürünler, kategoriler, stok hareketleri gibi konularda size destek olabilirim.',
        'Merhaba! Ben sistemin AI asistanıyım. Stok yönetimi, ürün takibi, raporlama gibi konularda size yardımcı oluyorum. Nasıl destek olabilirim?'
      ]
      response = responses[Math.floor(Math.random() * responses.length)]
    }

    // Eğer yerel yanıt varsa onu kullan
    if (response) {
      return {
        success: true,
        message: response
      }
    }

    // Yerel yanıt yoksa Gemini API'yi dene
    try {
      const aiResponse = await this.callGeminiAPI(text)
      if (aiResponse) {
        return {
          success: true,
          message: aiResponse
        }
      }
    } catch (error) {
      console.warn('Gemini API yanıt vermedi')
    }

    // Hiçbir yanıt alınamadıysa null dön
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
    const message = result && result.message ? result.message : 'İşlem başarıyla tamamlandı.'
    return `AI Asistan: ${message}`
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
    } else if (['category', 'product', 'supplier', 'unit', 'stockMovement'].includes(intent.domain)) {
      return {
        type: 'direct',
        operation: `${intent.domain}_${intent.action}`
      }
    }
    return null
  }

  async analyzeIntent(text) {
    const mlResult = await this.analyzeIntentML(text)
    if (mlResult && mlResult.confidence >= 0.8) {
      return mlResult
    }
    for (const key in this.patterns) {
      const group = this.patterns[key]
      for (const pattern of group.patterns) {
        const match = text.match(pattern)
        if (match) {
          const action = group.getAction ? group.getAction(text.toLowerCase()) : group.action
          return { domain: group.domain, action, match }
        }
      }
    }
    return null
  }

  async analyzeIntentML(text) {
    try {
      const response = await fetch('/api/analyze-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('ML Intent Analysis Error:', error)
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

        case 'stockMovement_create':
          if (!params.name) throw new Error('Ürün adı gerekli')
          if (!params.quantity) throw new Error('Miktar gerekli')
          const stockMovementProduct = await this.findProduct(params.name)
          if (!stockMovementProduct) throw new Error('Ürün bulunamadı')
          return await context.addStockMovement({
            type: params.quantity > 0 ? 'in' : 'out',
            product_id: stockMovementProduct.id,
            quantity: Math.abs(params.quantity),
            unit_id: stockMovementProduct.unit_id,
            price: stockMovementProduct.price_selling || 0,
            total_price: stockMovementProduct.price_selling * Math.abs(params.quantity),
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
    const match = text.match(/(?:öğren|kaydet):\s*"([^"]+)"\s*->\s*"([^"]+)"/)
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