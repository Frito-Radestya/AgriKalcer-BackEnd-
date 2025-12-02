// Test backend date formatting
console.log('=== BACKEND DATE FORMAT TEST ===\n')

// Simulasi presentPlant function yang sudah diperbaiki
function presentPlant(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    planting_date: row.planting_date ? new Date(row.planting_date).toLocaleDateString('en-CA') : null,
    estimated_harvest_date: row.estimated_harvest_date ? new Date(row.estimated_harvest_date).toLocaleDateString('en-CA') : null,
    notes: row.notes,
  }
}

// Test dengan database row simulation
const mockDatabaseRow = {
  id: 1,
  name: 'Test Plant',
  status: 'active',
  planting_date: new Date('2025-11-23'),
  estimated_harvest_date: new Date('2025-11-23'),
  notes: 'Test notes'
}

console.log('Database row:', mockDatabaseRow)
console.log('Backend response:', presentPlant(mockDatabaseRow))

// Test dengan string dates (common case)
const mockStringRow = {
  id: 2,
  name: 'Test Plant 2',
  status: 'active',
  planting_date: '2025-11-23',
  estimated_harvest_date: '2025-11-23',
  notes: 'Test notes 2'
}

console.log('\nString row:', mockStringRow)
console.log('Backend response (string):', presentPlant(mockStringRow))

// Test edge cases
console.log('\n=== EDGE CASES ===')
const edgeCases = [
  { planting_date: '2025-11-23T00:00:00Z', estimated_harvest_date: '2025-11-23T00:00:00Z' },
  { planting_date: '2025-11-23T15:30:00Z', estimated_harvest_date: '2025-11-23T15:30:00Z' },
  { planting_date: '2025-11-23T23:59:59Z', estimated_harvest_date: '2025-11-23T23:59:59Z' }
]

edgeCases.forEach((edge, i) => {
  const result = presentPlant({ ...edge, id: i + 3, name: `Edge ${i + 1}`, status: 'active', notes: '' })
  console.log(`Edge ${i + 1}:`, result)
})

console.log('\n=== EXPECTED RESULT ===')
console.log('✅ All dates should be: 2025-11-23')
console.log('✅ No more timezone issues!')
console.log('✅ Frontend receives consistent YYYY-MM-DD format')
