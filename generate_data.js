import 'dotenv/config';
import db from './src/db.js';

async function generateData() {
  console.log('-- Generated data for Neon import');
  console.log('-- Users');
  const { rows: users } = await db.query('SELECT * FROM users');
  users.forEach(u => {
    console.log(`INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES (${u.id}, '${u.name}', '${u.email}', '${u.password}', '${u.role}', '${u.created_at.toISOString()}', '${u.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Lands');
  const { rows: lands } = await db.query('SELECT * FROM lands');
  lands.forEach(l => {
    console.log(`INSERT INTO lands (id, user_id, name, location, area_size, latitude, longitude, notes, created_at, updated_at) VALUES (${l.id}, ${l.user_id}, '${l.name}', ${l.location ? `'${l.location}'` : 'NULL'}, ${l.area_size || 'NULL'}, ${l.latitude || 'NULL'}, ${l.longitude || 'NULL'}, ${l.notes ? `'${l.notes}'` : 'NULL'}, '${l.created_at.toISOString()}', '${l.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Plant Types');
  const { rows: types } = await db.query('SELECT * FROM plant_types');
  types.forEach(t => {
    console.log(`INSERT INTO plant_types (id, name, watering_interval, harvest_days, icon, created_at, updated_at) VALUES (${t.id}, '${t.name}', ${t.watering_interval || 'NULL'}, ${t.harvest_days || 'NULL'}, ${t.icon ? `'${t.icon}'` : 'NULL'}, '${t.created_at.toISOString()}', '${t.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Plants');
  const { rows: plants } = await db.query('SELECT * FROM plants');
  plants.forEach(p => {
    console.log(`INSERT INTO plants (id, user_id, land_id, plant_type_id, name, planting_date, estimated_harvest_date, status, notes, created_at, updated_at) VALUES (${p.id}, ${p.user_id}, ${p.land_id || 'NULL'}, ${p.plant_type_id || 'NULL'}, '${p.name}', ${p.planting_date ? `'${p.planting_date.toISOString().split('T')[0]}'` : 'NULL'}, ${p.estimated_harvest_date ? `'${p.estimated_harvest_date.toISOString().split('T')[0]}'` : 'NULL'}, '${p.status}', ${p.notes ? `'${p.notes}'` : 'NULL'}, '${p.created_at.toISOString()}', '${p.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Reminders');
  const { rows: reminders } = await db.query('SELECT * FROM reminders');
  reminders.forEach(r => {
    console.log(`INSERT INTO reminders (id, user_id, plant_id, type, due_date, status, active, notes, created_at, updated_at) VALUES (${r.id}, ${r.user_id}, ${r.plant_id || 'NULL'}, '${r.type}', '${r.due_date.toISOString()}', '${r.status}', ${r.active}, ${r.notes ? `'${r.notes}'` : 'NULL'}, '${r.created_at.toISOString()}', '${r.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Notifications');
  const { rows: notifs } = await db.query('SELECT * FROM notifications');
  notifs.forEach(n => {
    console.log(`INSERT INTO notifications (id, user_id, title, message, type, is_read, related_entity_type, related_entity_id, created_at) VALUES (${n.id}, ${n.user_id}, '${n.title}', '${n.message}', '${n.type}', ${n.is_read}, ${n.related_entity_type ? `'${n.related_entity_type}'` : 'NULL'}, ${n.related_entity_id || 'NULL'}, '${n.created_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Harvests');
  const { rows: harvests } = await db.query('SELECT * FROM harvests');
  harvests.forEach(h => {
    console.log(`INSERT INTO harvests (id, user_id, plant_id, date, amount, unit, price_per_kg, revenue, quality, notes, created_at) VALUES (${h.id}, ${h.user_id}, ${h.plant_id || 'NULL'}, '${h.date.toISOString().split('T')[0]}', ${h.amount || 'NULL'}, ${h.unit ? `'${h.unit}'` : 'NULL'}, ${h.price_per_kg || 'NULL'}, ${h.revenue || 'NULL'}, ${h.quality ? `'${h.quality}'` : 'NULL'}, ${h.notes ? `'${h.notes}'` : 'NULL'}, '${h.created_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Maintenance');
  const { rows: maint } = await db.query('SELECT * FROM maintenance');
  maint.forEach(m => {
    console.log(`INSERT INTO maintenance (id, user_id, plant_id, type, date, notes, cost, created_at, updated_at) VALUES (${m.id}, ${m.user_id}, ${m.plant_id || 'NULL'}, '${m.type}', '${m.date.toISOString().split('T')[0]}', ${m.notes ? `'${m.notes}'` : 'NULL'}, ${m.cost || 'NULL'}, '${m.created_at.toISOString()}', '${m.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Productivity Metrics');
  const { rows: prod } = await db.query('SELECT * FROM productivity_metrics');
  prod.forEach(p => {
    console.log(`INSERT INTO productivity_metrics (id, user_id, plant_id, metric_date, height, health_score, growth_rate, notes, created_at) VALUES (${p.id}, ${p.user_id}, ${p.plant_id || 'NULL'}, '${p.metric_date.toISOString().split('T')[0]}', ${p.height || 'NULL'}, ${p.health_score || 'NULL'}, ${p.growth_rate || 'NULL'}, ${p.notes ? `'${p.notes}'` : 'NULL'}, '${p.created_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Finances');
  const { rows: fins } = await db.query('SELECT * FROM finances');
  fins.forEach(f => {
    console.log(`INSERT INTO finances (id, user_id, plant_id, type, category, amount, description, date, created_at, updated_at) VALUES (${f.id}, ${f.user_id}, ${f.plant_id || 'NULL'}, '${f.type}', ${f.category ? `'${f.category}'` : 'NULL'}, ${f.amount}, ${f.description ? `'${f.description}'` : 'NULL'}, '${f.date.toISOString().split('T')[0]}', '${f.created_at.toISOString()}', '${f.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Message Templates');
  const { rows: tmpl } = await db.query('SELECT * FROM message_templates');
  tmpl.forEach(t => {
    console.log(`INSERT INTO message_templates (id, template_key, name, subject, body, type, variables, created_at, updated_at) VALUES (${t.id}, '${t.template_key}', '${t.name}', ${t.subject ? `'${t.subject}'` : 'NULL'}, '${t.body}', '${t.type}', ${t.variables ? `'${JSON.stringify(t.variables).replace(/'/g, "''")}'` : 'NULL'}, '${t.created_at.toISOString()}', '${t.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- Email Settings');
  const { rows: email } = await db.query('SELECT * FROM email_settings');
  email.forEach(e => {
    console.log(`INSERT INTO email_settings (id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name, is_active, created_at, updated_at) VALUES (${e.id}, '${e.smtp_host}', ${e.smtp_port}, ${e.smtp_secure}, '${e.smtp_user}', '${e.smtp_pass}', '${e.from_email}', ${e.from_name ? `'${e.from_name}'` : 'NULL'}, ${e.is_active}, '${e.created_at.toISOString()}', '${e.updated_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  console.log('-- OTP Codes');
  const { rows: otp } = await db.query('SELECT * FROM otp_codes');
  otp.forEach(o => {
    console.log(`INSERT INTO otp_codes (id, email, otp_hash, purpose, expires_at, attempts, created_at) VALUES (${o.id}, '${o.email}', '${o.otp_hash}', '${o.purpose}', '${o.expires_at.toISOString()}', ${o.attempts}, '${o.created_at.toISOString()}') ON CONFLICT (id) DO NOTHING;`);
  });

  await db.end();
}

generateData().catch(console.error);
