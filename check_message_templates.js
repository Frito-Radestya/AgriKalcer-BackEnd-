import { query } from './src/db.js';

async function checkMessageTemplates() {
  try {
    const { rows } = await query('SELECT * FROM message_templates ORDER BY template_key');
    console.log('Available message templates:');
    rows.forEach(template => {
      console.log(`\n📝 ${template.template_key}`);
      console.log(`   Title: ${template.title_template}`);
      console.log(`   Message: ${template.message_template}`);
      console.log(`   Active: ${template.is_active}`);
    });
    console.log(`\nTotal templates: ${rows.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkMessageTemplates();
