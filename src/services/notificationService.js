import db from '../db.js';
import { sendMail } from '../utils/emailConfig.js';

export async function createNotification(userId, plantId, title, message, notificationType, scheduledTime) {
  try {
    // Cek status panen tanaman
    const plantCheck = await db.query(
      'SELECT harvest_status FROM plants WHERE id = $1',
      [plantId]
    );

    // Jika tanaman sudah dipanen, jangan buat notifikasi
    if (plantCheck.rows[0]?.harvest_status === 'harvested') {
      console.log(`Tanaman dengan ID ${plantId} sudah dipanen, notifikasi tidak dibuat`);
      return { success: false, error: 'Tanaman sudah dipanen' };
    }

    const result = await db.query(
      `INSERT INTO notifications 
       (user_id, plant_id, title, message, notification_type, scheduled_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, plantId, title, message, notificationType, scheduledTime]
    );

    return { success: true, notification: result.rows[0] };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

export async function scheduleWateringReminder(userId, plantId, nextWateringDate) {
  const title = 'Pengingat Penyiraman';
  const message = `Waktunya menyiram tanaman Anda. Tanaman dengan ID ${plantId} membutuhkan penyiraman.`;
  
  return createNotification(
    userId,
    plantId,
    title,
    message,
    'watering',
    nextWateringDate
  );
}

export async function scheduleFertilizingReminder(userId, plantId, nextFertilizingDate) {
  const title = 'Pengingat Pemupukan';
  const message = `Waktunya memupuk tanaman Anda. Tanaman dengan ID ${plantId} membutuhkan pemupukan.`;
  
  return createNotification(
    userId,
    plantId,
    title,
    message,
    'fertilizing',
    nextFertilizingDate
  );
}

export async function markAsHarvested(plantId) {
  try {
    // Update status tanaman menjadi 'harvested'
    await db.query(
      'UPDATE plants SET harvest_status = $1, updated_at = NOW() WHERE id = $2',
      ['harvested', plantId]
    );

    // Nonaktifkan semua notifikasi yang terkait dengan tanaman ini
    await db.query(
      'UPDATE notifications SET is_active = false, updated_at = NOW() WHERE plant_id = $1',
      [plantId]
    );

    return { success: true };
  } catch (error) {
    console.error('Error marking plant as harvested:', error);
    return { success: false, error: error.message };
  }
}

export async function getActiveNotifications(userId) {
  try {
    const result = await db.query(
      `SELECT n.*, p.name as plant_name, p.harvest_status
       FROM notifications n
       JOIN plants p ON n.plant_id = p.id
       WHERE n.user_id = $1 
       AND n.is_active = true
       AND p.harvest_status != 'harvested'
       ORDER BY n.scheduled_time ASC`,
      [userId]
    );

    return { success: true, notifications: result.rows };
  } catch (error) {
    console.error('Error getting active notifications:', error);
    return { success: false, error: error.message };
  }
}
