import fs from 'fs';
import path from 'path';
import { LOGO_BASE64 } from './constants_logo.ts';

// Remover o prefixo data:image/png;base64,
const base64Data = LOGO_BASE64.replace(/^data:image\/png;base64,/, "");

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Salvar como ícones para o PWA
// Em um cenário real, deveríamos redimensionar, mas aqui vamos salvar o mesmo arquivo
// e confiar que o navegador lida com isso ou que a logo já tem tamanho bom.
const icons = ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'];

icons.forEach(iconName => {
    fs.writeFileSync(path.join(publicDir, iconName), base64Data, 'base64');
    console.log(`Gerado: public/${iconName}`);
});
