import { execSync } from 'child_process';

const leverUrls = [
    'https://jobs.lever.co/anthropic/e3cdeebf-1f10-4edc-af05-5cc16e118ca2',
    'https://jobs.lever.co/notion/b10a4db0-2529-470a-af27-805175659fb2',
    'https://jobs.lever.co/ramp/0248a313-dbde-41f0-bc37-77aa53aaea14',
    'https://jobs.lever.co/scale/fc31ba28-c1a7-47ab-a1ea-b9034d6caad0'
];

const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260420-staff-mle\\resume-dhl-20260420-staff-mle.pdf";

for (const url of leverUrls) {
    console.log('\n--- Testing Lever URL: ' + url);
    try {
        const out = execSync(`npm run autofill:lever "${url}" "${resumePath}"`, { 
            env: { ...process.env, BATCH_EVAL_MODE: 'true' },
            stdio: 'pipe' 
        });
        
        const output = out.toString();
        const match = output.match(/__TELEMETRY__(.*)__TELEMETRY__/);
        if (match) {
            const data = JSON.parse(match[1]);
            console.log(`[Result] Fill Rate: ${data.fillPercentage}%, Status: ${data.status}`);
            if (data.status === 'Success') {
                console.log('🎉 FOUND A SUCCESSFUL SUBMISSION! Halting further tests to avoid spam.');
                break;
            }
        }
    } catch(e) {
        if (e.stdout) {
            const match = e.stdout.toString().match(/__TELEMETRY__(.*)__TELEMETRY__/);
            if (match) {
                const data = JSON.parse(match[1]);
                console.log(`[Result] Status: ${data.status}`);
            } else {
                console.log('Script failed. No telemetry.');
            }
        }
    }
}


