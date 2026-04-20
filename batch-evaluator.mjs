import { exec } from 'child_process';
import fs from 'fs';
import util from 'util';

const execPromise = util.promisify(exec);

// Identify targeted Job Endpoints from pipeline.md dynamically
const rawPipeline = fs.readFileSync('data/pipeline.md', 'utf8').split('\n');
const leverUrls = [];
const greenhouseUrls = [];
const ashbyUrls = [];
for (const line of rawPipeline) {
    if (!line.includes('- [ ]')) continue;
    const rawUrl = line.substring(line.indexOf('[ ]') + 3).split('|')[0].trim();
    const url = rawUrl.split('?')[0]; 
    if (url.includes('lever.co')) leverUrls.push(url);
    if (url.includes('greenhouse.io') || rawUrl.includes('gh_jid=')) greenhouseUrls.push(rawUrl);
    if (url.includes('ashbyhq.com')) ashbyUrls.push(url);
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
    ...shuffle(leverUrls).slice(0, 10).map(url => ({ url, run: 'autofill:lever' })),
    ...shuffle(greenhouseUrls).slice(0, 10).map(url => ({ url, run: 'autofill:greenhouse' })),
    ...shuffle(ashbyUrls).slice(0, 15).map(url => ({ url, run: 'autofill:ashby' }))
];

const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260304-staff-mle\\resume-dhl-20260304-staff-mle.pdf";

console.log(`Starting headless evaluation over ${targets.length} endpoints...`);

(async () => {
    const statsStore = [];
    
    // Sequential execution to natively hijack Chrome profile lockfiles safely
    const chunkSize = 1;
    
    for (let i = 0; i < targets.length; i += chunkSize) {
        const chunk = targets.slice(i, i + chunkSize);
        console.log(`\nDispatching sequential profile execution [${i+1} of ${targets.length}]...`);
        
        const chunkPromises = chunk.map(async (target, idx) => {
            const { url, run } = target;
            try {
                const { stdout } = await execPromise(`npm run ${run} "${url}" "${resumePath}"`, {
                    env: { ...process.env, BATCH_EVAL_MODE: 'true' }
                });
                
                const match = stdout.match(/__TELEMETRY__(.*)__TELEMETRY__/);
                if (match) {
                    const payload = JSON.parse(match[1]);
                    console.log(`[${run}] ✅ Fill Rate: ${payload.fillPercentage}% (${payload.filled}/${payload.total} fields) on ${url}`);
                    return { url, status: 'Success', ...payload };
                } else {
                    console.log(`[${run}] ⚠️ Completed without telemetry on ${url}`);
                    return { url, status: 'Script Exited cleanly but no telemetry found.', fillPercentage: 0 };
                }
            } catch (error) {
                console.log(`[${run}] ❌ Script Error/Crash on ${url}`);
                return { url, status: 'Error', fillPercentage: 0 };
            }
        });

        const completedChunk = await Promise.all(chunkPromises);
        statsStore.push(...completedChunk);
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
