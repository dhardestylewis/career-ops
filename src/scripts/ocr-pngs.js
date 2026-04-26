const fs = require('fs');
const Tesseract = require('tesseract.js');
const path = require('path');

const archiveDir = path.resolve('data/archive');
const files = fs.readdirSync(archiveDir).filter(f => f.startsWith('debug_') && f.endsWith('.png'));

const resultsFile = 'logs/ocr_results.json';
let results = {};
if (fs.existsSync(resultsFile)) {
    try {
        results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
    } catch (err) {
        console.warn('Could not parse existing logs/ocr_results.json, starting fresh.');
    }
}

async function runOCR() {
    console.log(`Starting OCR analysis on ${files.length} missing field screenshots...`);
    for (const file of files) {
        if (results[file]) {
            console.log(`⏭️  Skipping ${file}, already processed.`);
            continue;
        }

        const filePath = path.join(archiveDir, file);
        console.log(`Analyzing ${file}...`);
        try {
            const { data: { text } } = await Tesseract.recognize(filePath, 'eng', { logger: m => {} });
            results[file] = text.split('\n').filter(line => line.trim().length > 10);
            console.log(`✅ Extracted ${results[file].length} lines of text from ${file}`);
            
            // Save partial results immediately
            fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        } catch (err) {
            console.error(`❌ Failed to OCR ${file}: ${err.message}`);
        }
    }
    
    console.log("OCR Batch complete. Results saved to logs/ocr_results.json");
}

runOCR();
