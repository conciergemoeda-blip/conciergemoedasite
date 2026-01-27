
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually read .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Buscando credenciais no .env...');
    console.log('URL encontrada:', !!supabaseUrl);
    console.log('Key encontrada:', !!supabaseAnonKey);
    console.error('Faltando VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorage() {
    console.log('Testando conexão com Supabase Storage...');
    console.log('URL:', supabaseUrl);

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

    if (bucketsError) {
        console.error('Erro ao listar buckets:', bucketsError.message);
        console.error('Detalhes:', bucketsError);
        return;
    }

    console.log('Buckets encontrados:', buckets.map(b => b.name));

    const bucketName = 'property-images';
    const bucketExists = buckets.some(b => b.name === bucketName);

    if (!bucketExists) {
        console.error(`Bucket "${bucketName}" NÃO encontrado!`);
        console.log('Você precisa criar o bucket "property-images".');
        console.log('Execute o script fix_permissions.sql no SQL Editor do Supabase.');
    } else {
        console.log(`Bucket "${bucketName}" existe. Verificando acesso...`);

        // Try to list files in the bucket
        const { data: files, error: filesError } = await supabase
            .storage
            .from(bucketName)
            .list();

        if (filesError) {
            console.error(`Erro ao listar arquivos em "${bucketName}":`, filesError.message);
        } else {
            console.log(`Sucesso! Listagem de arquivos em "${bucketName}": ${files.length} arquivos.`);
        }
    }
}

testStorage();
