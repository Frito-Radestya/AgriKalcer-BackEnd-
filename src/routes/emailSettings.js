import express from 'express';
import { 
  getActiveConfig, 
  saveConfig, 
  testConnection 
} from '../controllers/emailSettingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Only admin can access these endpoints
router.use(authenticate);
router.use(authorize(['admin']));

// Get active configuration
router.get('/', getActiveConfig);

// Save configuration
router.post('/', saveConfig);

// Test SMTP connection
router.post('/test-connection', testConnection);

export default router;
