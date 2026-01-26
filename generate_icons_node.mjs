import fs from 'fs';
import path from 'path';

const projectRoot = 'c:\\Users\\leona\\OneDrive\\Documentos\\concierge-moeda';
const constantsPath = path.join(projectRoot, 'constants_logo.ts');
const publicDir = path.join(projectRoot, 'public');

try {
    // Ler arquivo como texto
    const content = fs.readFileSync(constantsPath, 'utf-8');

    // Extrair base64 via Regex
    const match = content.match(/LOGO_BASE64\s*=\s*"(data:image\/png;base64,)([^"]+)"/);

    if (match && match[2]) {
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        const icons = ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'];

        icons.forEach(iconName => {
            fs.writeFileSync(path.join(publicDir, iconName), buffer);
            console.log(`Gerado: public/${iconName}`);
        });
        console.log('Todos os ícones gerados com sucesso!');
    } else {
        console.error('Não encontrei a LOGO_BASE64 no arquivo constants_logo.ts');
    }
} catch (err) {
    console.error('Erro:', err);
}
