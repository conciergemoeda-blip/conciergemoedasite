import fs from 'fs';
import path from 'path';

// Caminhos
// Usando raw source path do ultimo upload válido
const sourcePath = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\025d2ce7-9407-4fe0-8107-8d5229a69541\\uploaded_media_1769361373434.png';
const projectRoot = 'c:\\Users\\leona\\OneDrive\\Documentos\\concierge-moeda';
const destPathPublic = path.join(projectRoot, 'public', 'logo.png');
// Vite as vezes serve da raiz se nao tiver public configurado
const destPathRoot = path.join(projectRoot, 'logo.png');

if (!fs.existsSync(path.join(projectRoot, 'public'))) {
    fs.mkdirSync(path.join(projectRoot, 'public'), { recursive: true });
}

try {
    fs.copyFileSync(sourcePath, destPathPublic);
    console.log('Logo copiada para PUBLIC com sucesso');

    fs.copyFileSync(sourcePath, destPathRoot);
    console.log('Logo copiada para RAIZ com sucesso');
} catch (error) {
    console.error('Falha na copia:', error);
}
