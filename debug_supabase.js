
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    console.log('URL:', supabaseUrl);

    // Test simple query
    const { data, error, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Connection failed or table access error:', error);
    } else {
        console.log('Connection successful!');
        console.log('Total properties in DB:', count);
    }

    // Try to fetch one property to see the structure
    const { data: oneProp, error: fetchErr } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

    if (fetchErr) {
        console.error('Error fetching property data:', fetchErr);
    } else if (oneProp && oneProp.length > 0) {
        console.log('Sample property found! Structure:', JSON.stringify(oneProp[0], null, 2));
    } else {
        console.log('No properties found in the table.');
    }
}

testConnection();
