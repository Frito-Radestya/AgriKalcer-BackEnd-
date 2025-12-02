import express from 'express'
import multer from 'multer'
import groqService from '../services/groqService.js'

const router = express.Router()

// Setup multer untuk upload gambar
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Chat dengan AI untuk konsultasi pertanian & general knowledge
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required' 
      })
    }

    const response = await groqService.generalChat(message)
    
    res.json({
      success: true,
      response
    })
  } catch (error) {
    console.error('AI Chat Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to get AI response' 
    })
  }
})

// Deteksi penyakit tanaman dari gambar
router.post('/detect-disease', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      })
    }

    // Simpan gambar sementara
    const imagePath = groqService.saveUploadedImage(req.file)
    
    try {
      // Analisis dengan AI
      const analysis = await groqService.detectPlantDisease(imagePath)
      
      res.json({
        success: true,
        analysis,
        fileName: req.file.originalname
      })
    } finally {
      // Cleanup file setelah analisis
      try {
        const fs = await import('fs')
        fs.unlinkSync(imagePath)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }
  } catch (error) {
    console.error('Plant Disease Detection Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze plant disease'
    })
  }
})

// Analisis kesehatan tanaman dari text
router.post('/analyze-plant', async (req, res) => {
  try {
    const { symptoms } = req.body
    
    if (!symptoms) {
      return res.status(400).json({ 
        success: false,
        error: 'Symptoms are required' 
      })
    }

    const analysis = await groqService.analyzePlantHealth(symptoms)
    
    res.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('Plant Analysis Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to analyze plant health' 
    })
  }
})

// Rekomendasi cuaca
router.post('/weather-advice', async (req, res) => {
  try {
    const { weather, cropType } = req.body
    
    if (!weather || !cropType) {
      return res.status(400).json({ 
        success: false,
        error: 'Weather and crop type are required' 
      })
    }

    const advice = await groqService.getWeatherAdvice(weather, cropType)
    
    res.json({
      success: true,
      advice
    })
  } catch (error) {
    console.error('Weather Advice Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to get weather advice' 
    })
  }
})

// Get info tentang jenis-jenis padi
router.get('/rice-varieties', async (req, res) => {
  try {
    const response = await groqService.generalChat('Berikan informasi lengkap tentang jenis-jenis padi yang ada di Indonesia beserta karakteristiknya')
    
    res.json({
      success: true,
      varieties: response
    })
  } catch (error) {
    console.error('Rice Varieties Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get rice varieties info'
    })
  }
})

// Get info tentang hama dan cara mengatasi
router.get('/pest-control', async (req, res) => {
  try {
    const response = await groqService.generalChat('Berikan informasi lengkap tentang hama-hama pertanian umum di Indonesia dan cara mengatasinya secara organik maupun kimia')
    
    res.json({
      success: true,
      pestControl: response
    })
  } catch (error) {
    console.error('Pest Control Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get pest control info'
    })
  }
})

// Get personalized recommendations based on user data
router.post('/recommendations', async (req, res) => {
  try {
    const { userId, userData } = req.body
    
    // Analisis data pertanian user
    const analysisPrompt = `Kamu adalah ahli pertanian profesional. Analisis data pertanian berikut dan berikan saran personal:

Data User ID: ${userId}
📊 Data Tanaman: ${JSON.stringify(userData.plants || 'Tidak ada data')}
🌾 Data Panen: ${JSON.stringify(userData.harvests || 'Tidak ada data')}  
🏞️ Data Lahan: ${JSON.stringify(userData.lands || 'Tidak ada data')}
💧 Data Perawatan: ${JSON.stringify(userData.maintenance || 'Tidak ada data')}
💰 Data Keuangan: ${JSON.stringify(userData.finances || 'Tidak ada data')}

Buatkan 3-5 saran personal yang actionable:
1. Saran optimasi tanaman
2. Saran peningkatan hasil panen
3. Saran efisiensi biaya
4. Saran perawatan preventif
5. Saran pengembangan lahan

Format response JSON:
{
  "recommendations": [
    {
      "category": "tanaman|panen|lahan|perawatan|keuangan",
      "priority": "high|medium|low", 
      "title": "Judul saran",
      "description": "Penjelasan detail",
      "action_items": ["action 1", "action 2", "action 3"],
      "expected_benefit": "Manfaat yang diharapkan"
    }
  ],
  "overall_score": 85,
  "insights": "Wawasan umum tentang kondisi pertanian user"
}

Jawab dalam bahasa Indonesia yang praktis dan mudah diimplementasikan.`

    const response = await groqService.generalChat(analysisPrompt)
    
    // Parse response dan buat notifikasi
    let recommendations
    try {
      recommendations = JSON.parse(response)
    } catch (e) {
      // Fallback jika response tidak valid JSON
      recommendations = {
        recommendations: [
          {
            category: "general",
            priority: "medium",
            title: "Saran Pertanian",
            description: response,
            action_items: ["Implementasikan saran AI"],
            expected_benefit: "Peningkatan produktivitas"
          }
        ],
        overall_score: 75,
        insights: "AI analysis completed"
      }
    }
    
    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('AI Recommendations Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    })
  }
})

export default router
