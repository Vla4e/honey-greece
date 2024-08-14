import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const directoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist/assets');


fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
    }
    files.forEach((file) => {
        if (file.endsWith('.js')) {
            const filePath = path.join(directoryPath, file);
            fs.readFile(filePath, 'utf8', (readErr, originalCode) => {
                if (readErr) {
                    console.log('Error reading file:', readErr);
                    return;
                }
                const obfuscatedCode = JavaScriptObfuscator.obfuscate(originalCode, {
                    compact: true,
                    controlFlowFlattening: true,
                    // You can add more options here
                }).getObfuscatedCode();

                fs.writeFile(filePath, obfuscatedCode, (writeErr) => {
                    if (writeErr) {
                        console.log('Error writing file:', writeErr);
                    }
                });
            });
        }
    });
});
