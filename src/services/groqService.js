import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'

class GroqService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set. Please define it in your environment (.env) but do NOT commit it to git.')
    }

    this.client = new Groq({
      apiKey
    })
  }

  async chatCompletion(messages, model = 'llama-3.1-8b-instant') {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
      return response.choices[0].message.content
    } catch (error) {
      console.error('Groq API Error:', error)
      throw new Error('Failed to get AI response')
    }
  }

  async generalChat(message) {
    const messages = [
      {
        role: 'system',
        content: `Kamu adalah asisten AI yang ramah dan membantu. Kamu bisa menjawab pertanyaan tentang:
        - Pertanian (jenis tanaman, hama, penyakit, cara menanam, dll)
        - Pengetahuan umum (sejarah, geografi, politik, sains, dll)
        - Berbagai topik lainnya
        
        Jawab dengan bahasa Indonesia yang sopan dan informatif. Jika tidak tahu jawabannya, katakan dengan jujur.`
      },
      {
        role: 'user',
        content: message
      }
    ]

    return await this.chatCompletion(messages)
  }

  async getFarmingAdvice(question) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert agricultural assistant. Provide practical farming advice in Indonesian. Be concise and helpful.'
      },
      {
        role: 'user',
        content: question
      }
    ]

    return await this.chatCompletion(messages)
  }

  async analyzePlantHealth(symptoms) {
    const messages = [
      {
        role: 'system',
        content: 'You are a plant disease expert. Analyze plant symptoms and provide diagnosis and treatment recommendations in Indonesian.'
      },
      {
        role: 'user',
        content: `Gejala pada tanaman: ${symptoms}`
      }
    ]

    return await this.chatCompletion(messages)
  }

  async getWeatherAdvice(weather, cropType) {
    const messages = [
      {
        role: 'system',
        content: 'You are an agricultural weather expert. Provide farming advice based on weather conditions in Indonesian.'
      },
      {
        role: 'user',
        content: `Cuaca: ${weather}. Jenis tanaman: ${cropType}. Berikan rekomendasi perawatan.`
      }
    ]

    return await this.chatCompletion(messages)
  }

  async detectPlantDisease(imagePath) {
    try {
      // Base64 encode image
      const imageBuffer = fs.readFileSync(imagePath)
      const base64Image = imageBuffer.toString('base64')
      
      const messages = [
        {
          role: 'system',
          content: `Kamu adalah ahli penyakit tanaman. Analisis gambar tanaman yang diberikan dan identifikasi:
          1. Jenis penyakit (jika ada)
          2. Gejala yang terlihat
          3. Penyebab kemungkinan
          4. Cara penanganan dan pengobatan
          5. Langkah pencegahan
          
          Jawab dalam bahasa Indonesia dengan format yang jelas dan terstruktur. Jika tidak ada penyakit yang terdeteksi, berikan informasi tentang kondisi tanaman tersebut.`
        },
        {
          role: 'user',
          content: [
            {
              type: "text",
              text: "Analisis gambar tanaman ini dan berikan diagnosis penyakit serta rekomendasi penanganannya."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ]

      // Gunakan model vision yang support gambar
      const response = await this.client.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        temperature: 0.3,
        max_tokens: 1500
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Plant Disease Detection Error:', error)
      
      // Jika error karena gambar terlalu kecil atau format tidak didukung
      if (error.message?.includes('pixels') || error.message?.includes('dimension')) {
        return '❌ Gambar terlalu kecil atau format tidak didukung. Silakan upload gambar tanaman yang lebih jelas dengan minimal ukuran 50x50 pixel.'
      }
      
      // Fallback ke analisis text-based jika vision model gagal
      const fallbackAnalysis = await this.getPlantDiseaseInfo()
      return fallbackAnalysis
    }
  }

  async getPlantDiseaseInfo() {
    const messages = [
      {
        role: 'system',
        content: 'Kamu adalah ahli pertanian. Berikan informasi umum tentang penyakit tanaman umum di Indonesia dan cara penanganannya.'
      }
    ]

    return await this.chatCompletion(messages)
  }

  // Helper untuk menyimpan upload gambar
  saveUploadedImage(file) {
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    const fileName = `${Date.now()}-${file.originalname}`
    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, file.buffer)
    
    return filePath
  }
}

export default new GroqService()
