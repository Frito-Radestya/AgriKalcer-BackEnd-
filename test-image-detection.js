import groqService from './src/services/groqService.js'
import fs from 'fs'

// Test dengan base64 image sample (contoh: gambar tanaman yang sakit)
const testBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

async function testImageDetection() {
  try {
    console.log('Testing plant disease detection...')
    
    // Simpan gambar test sementara
    const buffer = Buffer.from(testBase64Image, 'base64')
    fs.writeFileSync('./test-plant.jpg', buffer)
    
    // Test deteksi penyakit
    const result = await groqService.detectPlantDisease('./test-plant.jpg')
    console.log('Detection Result:', result)
    
    // Cleanup
    fs.unlinkSync('./test-plant.jpg')
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testImageDetection()
