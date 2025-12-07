import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { query, checkTables } from './db.js';

// Import routes
import authRouter from './routes/auth.js';
import authForgotRouter from './routes/auth-forgot-simple.js';
import landsRouter from './routes/lands.js';
import plantsRouter from './routes/plants.js';
import plantTypesRouter from './routes/plantTypes.js';
import financesRouter from './routes/finances.js';
import maintenanceRouter from './routes/maintenance.js';
import harvestsRouter from './routes/harvests.js';
import notificationsRouter from './routes/notifications.js';
import remindersRouter from './routes/reminders.js';
import maintenanceLogsRouter from './routes/maintenance_logs.js';
import productivityMetricsRouter from './routes/productivity_metrics.js';
import messageTemplatesRouter from './routes/message_templates.js';
import aiRouter from './routes/ai.js';
import emailSettingsRouter from './routes/emailSettings.js';
import otpRouter from './routes/otp.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lumbungtaniapp.vercel.app', 'https://agrikalcer-backend-production.up.railway.app']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await query('SELECT NOW() as server_time, version() as db_version');
    const tablesExist = await checkTables();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        server_time: dbCheck.rows[0].server_time,
        version: dbCheck.rows[0].db_version.split('\n')[0],
        tables_ok: tablesExist
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/auth', authForgotRouter);
app.use('/api/lands', landsRouter);
app.use('/api/plants', plantsRouter);
app.use('/api/plant-types', plantTypesRouter);
app.use('/api/finances', financesRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/harvests', harvestsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reminders', remindersRouter)
app.use('/api/maintenance-logs', maintenanceLogsRouter)
app.use('/api/productivity-metrics', productivityMetricsRouter)
app.use('/api/message-templates', messageTemplatesRouter)
app.use('/api/ai', aiRouter)
app.use('/api/email-settings', emailSettingsRouter)
app.use('/api/otp', otpRouter)

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
