const db = require('./src/db.js');

async function forceUpdateLands() {
  try {
    console.log('🔧 Force update semua lands dengan data baru...');
    
    // Update dengan data yang berbeda untuk testing
    const updates = [
      { id: 1, name: 'RIAU - UPDATED', area_size: 3500.00, location: 'Lokasi RIAU diperbarui', notes: 'Catatan untuk RIAU' },
      { id: 2, name: 'LADANG AYAH - UPDATED', area_size: 1500.00, location: 'Ladang Ayah lokasi baru', notes: 'Catatan ladang ayah' },
      { id: 3, name: 'PUNYA AYAH - UPDATED', area_size: 2000.00, location: 'Punya ayah lokasi update', notes: 'Update notes' },
      { id: 4, name: 'FRITO RADESTYA - UPDATED', area_size: 2500.00, location: 'Frito lokasi baru', notes: 'Frito notes updated' },
      { id: 5, name: 'LAHAN BARU - UPDATED', area_size: 1200.00, location: 'Lahan baru lokasi', notes: 'Lahan baru notes' },
      { id: 6, name: 'AGRIKALCER - UPDATED', area_size: 1800.00, location: 'Agrikalcer lokasi', notes: 'Agrikalcer notes' }
    ];
    
    for (const update of updates) {
      const result = await db.query(
        'UPDATE lands SET name=$1, area_size=$2, location=$3, notes=$4, updated_at=NOW() WHERE id=$5',
        [update.name, update.area_size, update.location, update.notes, update.id]
      );
      
      console.log(`✅ Updated land ID ${update.id}: ${update.name} (${result.rowCount} row)`);
    }
    
    // Tampilkan hasil
    const finalResult = await db.query('SELECT id, name, area_size, location, notes, updated_at FROM lands ORDER BY id');
    console.log('📋 Final data:');
    console.log(finalResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

forceUpdateLands();
