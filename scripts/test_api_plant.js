import express from 'express';
import { calculateEstimatedHarvestDate } from '../src/utils/reminderHelper.js';

// Simulate the API logic
async function testPlantCreation() {
  const name = 'Test Plant API';
  const planting_date = '2025-11-23';
  const plant_type_id = 1;
  
  // Get plant type info for harvest days calculation
  let harvestDays = 60; // default
  if (plant_type_id) {
    // Simulate database query
    harvestDays = 75; // Padi has 75 days
  }
  
  // Calculate estimated harvest date
  const estimatedHarvestDate = calculateEstimatedHarvestDate(
    new Date(planting_date),
    harvestDays
  );
  
  console.log('=== API Plant Creation Test ===');
  console.log('Input planting_date:', planting_date);
  console.log('Harvest days:', harvestDays);
  console.log('Calculated estimated_harvest_date:', estimatedHarvestDate ? estimatedHarvestDate.toISOString().split('T')[0] : null);
  console.log('Local format:', estimatedHarvestDate ? estimatedHarvestDate.toLocaleDateString('id-ID') : null);
  
  // Test frontend mapping
  const frontendPlantDate = new Date(planting_date).toISOString().slice(0,10);
  const frontendHarvestDate = estimatedHarvestDate ? new Date(estimatedHarvestDate) : null;
  
  console.log('Frontend plantDate:', frontendPlantDate);
  console.log('Frontend harvestDate:', frontendHarvestDate ? frontendHarvestDate.toISOString().split('T')[0] : null);
}

testPlantCreation();
