import fs from 'fs';
import { execSync } from 'child_process';

const p = fs.readFileSync('data/pipeline.md', 'utf8').split('\n');
let url = null;
for (let i = p.length - 1; i >= 0; i--) {
    if (p[i].includes('lever.co') && p[i].includes('- [ ]')) {
        url = p[i].split('|')[0].replace('- [ ]', '').trim();
        break;
    }
}

if (url) {
    console.log('Found fresh URL: ' + url);
    const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260420-staff-mle\\resume-dhl-20260420-staff-mle.pdf";
    try {
        execSync(`npm run autofill:lever "${url}" "${resumePath}"`, { 
            env: { ...process.env, BATCH_EVAL_MODE: 'true' }, 
            stdio: 'inherit' 
        });
    } catch(e) {}
} else {
    console.log('No fresh URLs found');
}


