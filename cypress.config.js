const { defineConfig } = require('cypress')
const { createClient } = require('@supabase/supabase-js')
const credentials = require('./cypress/fixtures/supabaseCredentials.json') // Güvenlik: Supabase bağlantı bilgilerini dosyadan alıyoruz.

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // "cleanupTestData" görevini tanımlıyoruz.
      on('task', {
        cleanupTestData() {
          // Supabase bağlantı bilgilerini önce ortam değişkenlerinden, yoksa dosyadan alıyoruz.
          const supabaseUrl = process.env.SUPABASE_URL || credentials.url
          const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || credentials.anonKey

          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Test veritabanı bağlantı bilgileri eksik!')
          }

          // Supabase client'ını oluşturuyoruz.
          const supabase = createClient(supabaseUrl, supabaseAnonKey)

          // "test_data" sütunu true olan kayıtları temizliyoruz.
          return Promise.all([
            supabase.from('categories').delete().eq('test_data', true),
            supabase.from('sub_categories').delete().eq('test_data', true)
          ])
            .then(() => {
              return null // Görevi başarıyla tamamladık.
            })
            .catch((err) => {
              console.error('Test cleanup hatası:', err)
              throw err
            })
        }
      })

      return config
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}'
  },
  viewportWidth: 1280,
  viewportHeight: 720
}) 