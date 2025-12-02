import dotenv from 'dotenv'
dotenv.config()
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function checkStructure() {
  try {
    console.log('🔍 Checking maintenance table structure...')
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'maintenance'
      ORDER BY ordinal_position
    `
    
    const { rows: columns } = await pool.query(structureQuery)
    console.log('\n📋 Maintenance table columns:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })
    
    // Cek data maintenance
    console.log('\n📋 Sample maintenance data:')
    const dataQuery = `
      SELECT * FROM maintenance 
      WHERE type ILIKE '%penyiraman%' OR type ILIKE '%watering%'
      ORDER BY id DESC
      LIMIT 5
    `
    
    const { rows: data } = await pool.query(dataQuery)
    console.log(`\nFound ${data.length} maintenance records:`)
    
    data.forEach((m, index) => {
      console.log(`\n${index + 1}. ID: ${m.id}`)
      Object.keys(m).forEach(key => {
        console.log(`   ${key}: ${m[key]}`)
      })
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkStructure()
