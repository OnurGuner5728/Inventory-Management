import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const data = req.body
    const filePath = path.join(process.cwd(), 'src', 'data', 'db.json')
    
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
    
    res.status(200).json({ message: 'Data saved successfully' })
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({ message: 'Error saving data' })
  }
} 