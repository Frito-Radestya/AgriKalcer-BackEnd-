const db = require('./src/db.js');

async function fixLandsData() {
  try {
    console.log('🔧 Memperbaiki data lands yang null...');
    
    // Update semua lands yang area_size null dengan default 1000
    const updateResult = await db.query(
      'UPDATE lands SET area_size = COALESCE(area_size, 1000.00), notes = COALESCE(notes, \'\'), area = COALESCE(area, 1000.00) WHERE area_size IS NULL OR area IS NULL'
    );
    
    console.log(`✅ Berhasil update ${updateResult.rowCount} baris`);
    
    // Tampilkan hasil
    const result = await db.query('SELECT id, name, area, area_size, location, notes FROM lands ORDER BY id');
    console.log('📋 Data setelah perbaikan:');
    console.log(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixLandsData();
