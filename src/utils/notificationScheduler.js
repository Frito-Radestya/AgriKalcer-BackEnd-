import { sendMail } from './emailConfig.js';
import db from '../db.js';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export async function checkAndSendNotifications() {
  try {
    // Dapatkan notifikasi yang sudah waktunya dikirim
    const now = new Date();
    
    const result = await db.query(
      `SELECT n.*, u.email, u.full_name, p.name as plant_name
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       JOIN plants p ON n.plant_id = p.id
       WHERE n.scheduled_time <= $1 
       AND n.is_active = true
       AND n.is_read = false
       AND p.harvest_status != 'harvested'`,
      [now]
    );

    for (const notification of result.rows) {
      try {
        // Format waktu yang lebih ramah pengguna
        const formattedTime = format(notification.scheduled_time, 'PPPPp', { locale: id });
        
        // Kirim email notifikasi
        await sendMail({
          to: notification.email,
          subject: `${notification.title} - ${notification.plant_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>${notification.title}</h2>
              <p>Halo ${notification.full_name},</p>
              <p>${notification.message}</p>
              <p>Jadwal: <strong>${formattedTime}</strong></p>
              <p>Jenis: ${notification.notification_type === 'watering' ? 'Penyiraman' : 'Pemupukan'}</p>
              <p>---</p>
              <p>Ini adalah notifikasi otomatis. Harap jangan membalas email ini.</p>
            </div>
          `
        });

        // Tandai notifikasi sebagai sudah dibaca
        await db.query(
          'UPDATE notifications SET is_read = true, updated_at = NOW() WHERE id = $1',
          [notification.id]
        );

        console.log(`Notifikasi terkirim ke ${notification.email} untuk tanaman ${notification.plant_name}`);
      } catch (error) {
        console.error(`Gagal mengirim notifikasi ${notification.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in notification scheduler:', error);
  }
}

// Jalankan pengecekan setiap menit
setInterval(checkAndSendNotifications, 60 * 1000);

// Jalankan segera saat pertama kali di-load
checkAndSendNotifications();
