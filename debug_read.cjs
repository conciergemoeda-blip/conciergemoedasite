
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
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

async function testRead() {
    console.log('--- READ TEST ---');
    const { data, error, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ READ ERROR:', error.message);
        if (error.message.includes('policy')) console.log('   -> Confirmed: RLS Policy is blocking access.');
    } else {
        console.log(`✅ READ SUCCESS: Found ${count} properties.`);
    }
}

testRead();
