import fs from 'fs';
import path from 'path';

// Caminho da imagem que você enviou (a mais recente - formato web)
const sourcePath = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\025d2ce7-9407-4fe0-8107-8d5229a69541\\uploaded_media_1769363006637.png';
const destPath = 'c:\\Users\\leona\\OneDrive\\Documentos\\concierge-moeda\\constants_logo.ts';

try {
    // Lê o arquivo como buffer
    const imageBuffer = fs.readFileSync(sourcePath);
    // Converte para Base64
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;

    // Cria o conteúdo do arquivo TS
    const fileContent = `export const LOGO_BASE64 = "${dataUri}";`;

    // Salva na pasta do projeto
    fs.writeFileSync(destPath, fileContent);
    console.log('Sucesso: Logo convertida para código em constants_logo.ts');
} catch (err) {
    console.error('Erro ao converter:', err);
}
