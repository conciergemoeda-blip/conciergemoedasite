
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        const { data, error, count } = await supabase
            .from('properties')
            .select('id, title, active, featured', { count: 'exact' });

        if (error) {
            console.error('ERROR:', error.message);
            return;
        }

        console.log('COUNT:', count);
        if (data) {
            data.forEach(p => {
                console.log(`PROP: ${p.title} | ACTIVE: ${p.active} | FEATURED: ${p.featured}`);
            });
        }

    } catch (err) {
        console.error('SCRIPT_ERROR:', err.message);
    }
}

testConnection();
