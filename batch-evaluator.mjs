import { exec } from 'child_process';
import fs from 'fs';
import util from 'util';

const execPromise = util.promisify(exec);

// Identify targeted Job Endpoints from pipeline.md dynamically
const rawPipeline = fs.readFileSync('data/pipeline.md', 'utf8').split('\n');
const leverUrls = [];
const greenhouseUrls = [];
for (const line of rawPipeline) {
    if (!line.includes('- [ ]')) continue;
    const rawUrl = line.substring(line.indexOf('[ ]') + 3).split('|')[0].trim();
    const url = rawUrl.split('?')[0]; 
    if (url.includes('lever.co')) leverUrls.push(url);
    if (url.includes('greenhouse.io')) greenhouseUrls.push(url);
}

// Shuffle arrays for wide dispersion sampling
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const targets = [
    ...shuffle(leverUrls).slice(0, 25).map(url => ({ url, run: 'autofill:lever' })),
    ...shuffle(greenhouseUrls).slice(0, 25).map(url => ({ url, run: 'autofill:greenhouse' }))
];

const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260304-staff-mle\\resume-dhl-20260304-staff-mle.pdf";

console.log(`Starting headless evaluation over ${targets.length} endpoints...`);

(async () => {
    const statsStore = [];
    
    for (let i = 0; i < targets.length; i++) {
        const { url, run } = targets[i];
        console.log(`\nEvaluating [${i+1}/${targets.length}]: ${url}`);
        
        try {
            const { stdout } = await execPromise(`npm run ${run} "${url}" "${resumePath}"`, {
                env: { ...process.env, BATCH_EVAL_MODE: 'true' }
            });
            
            // Look for __TELEMETRY__ payload logged from the scripts
            const match = stdout.match(/__TELEMETRY__(.*)__TELEMETRY__/);
            if (match) {
                const payload = JSON.parse(match[1]);
                statsStore.push({ url, status: 'Success', ...payload });
                console.log(`✅ Fill Rate: ${payload.fillPercentage}% (${payload.filled}/${payload.total} fields)`);
            } else {
                statsStore.push({ url, status: 'Script Exited cleanly but no telemetry found.', fillPercentage: 0 });
                console.log(`⚠️ Completed without telemetry.`);
            }
        } catch (error) {
            console.log(`❌ Script Error/Crash.`);
            statsStore.push({ url, status: 'Error', fillPercentage: 0 });
        }
    }
    
    console.log("\n==================================");
    console.log("Batched Execution Complete. Dumping Output Artifact...");
    
    // Write markdown artifact
    let markdown = "# Headless Telemetry Report\n\n| URL | Fill Rate | Found | Filled | Status |\n|---|---|---|---|---|\n";
    const missingDOMData = {};
    for (const stat of statsStore) {
        markdown += `| ${stat.url.substring(0, 45)}... | ${stat.fillPercentage || 0}% | ${stat.total || 0} | ${stat.filled || 0} | ${stat.status} |\n`;
        if (stat.missingDOM && stat.missingDOM.length > 0) {
            missingDOMData[stat.url] = stat.missingDOM;
        }
    }
    
    fs.writeFileSync('evaluation_stats_run.md', markdown);
    fs.writeFileSync('missing_dom.json', JSON.stringify(missingDOMData, null, 2));
    console.log("Artifact generation complete: evaluation_stats_run.md and missing_dom.json");
})();
