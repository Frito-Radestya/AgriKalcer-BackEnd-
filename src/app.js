import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRouter from './routes/auth.js'
import authForgotRouter from './routes/auth-forgot.js'
import landsRouter from './routes/lands.js'
import plantsRouter from './routes/plants.js'
import plantTypesRouter from './routes/plantTypes.js'
import financesRouter from './routes/finances.js'
import maintenanceRouter from './routes/maintenance.js'
import harvestsRouter from './routes/harvests.js'
import notificationsRouter from './routes/notifications.js'
import remindersRouter from './routes/reminders.js'
import maintenanceLogsRouter from './routes/maintenance_logs.js'
import productivityMetricsRouter from './routes/productivity_metrics.js'
import messageTemplatesRouter from './routes/message_templates.js'
import aiRouter from './routes/ai.js'
import db from './db.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message })
  }
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/auth', authForgotRouter)
app.use('/api/lands', landsRouter)
app.use('/api/plants', plantsRouter)
app.use('/api/plant-types', plantTypesRouter)
app.use('/api/finances', financesRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/harvests', harvestsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/reminders', remindersRouter)
app.use('/api/maintenance-logs', maintenanceLogsRouter)
app.use('/api/productivity-metrics', productivityMetricsRouter)
app.use('/api/message-templates', messageTemplatesRouter)
app.use('/api/ai', aiRouter)

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
