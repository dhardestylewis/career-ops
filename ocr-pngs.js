const fs = require('fs');
const Tesseract = require('tesseract.js');
const path = require('path');

const archiveDir = path.resolve('data/archive');
const files = fs.readdirSync(archiveDir).filter(f => f.startsWith('debug_') && f.endsWith('.png'));

const results = {};

async function runOCR() {
    console.log(`Starting OCR analysis on ${files.length} missing field screenshots...`);
    for (const file of files) {
        const filePath = path.join(archiveDir, file);
        console.log(`Analyzing ${file}...`);
        try {
            const { data: { text } } = await Tesseract.recognize(filePath, 'eng', { logger: m => {} });
            results[file] = text.split('\\n').filter(line => line.trim().length > 10);
            console.log(`✅ Extracted ${results[file].length} lines of text from ${file}`);
        } catch (err) {
            console.error(`❌ Failed to OCR ${file}: ${err.message}`);
        }
    }
    
    fs.writeFileSync('logs/ocr_results.json', JSON.stringify(results, null, 2));
    console.log("OCR Batch complete. Results saved to logs/ocr_results.json");
}

runOCR();
