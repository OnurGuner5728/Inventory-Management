const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

// db.json dosyasının yolunu al
const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'db.json')

// Ana süreç ile iletişim için API
contextBridge.exposeInMainWorld('fileOperations', {
  readJsonFile: () => {
    try {
      if (!fs.existsSync(DB_PATH)) {
        console.error('db.json dosyası bulunamadı:', DB_PATH)
        return null
      }
      const data = fs.readFileSync(DB_PATH, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Dosya okuma hatası:', error)
      return null
    }
  },
  writeJsonFile: (data) => {
    try {
      const dir = path.dirname(DB_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
      return true
    } catch (error) {
      console.error('Dosya yazma hatası:', error)
      return false
    }
  }
})

// Bildirimler için API
contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (message) => {
    ipcRenderer.send('show-notification', message)
  }
}) 