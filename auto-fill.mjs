import { spawn } from 'child_process';

const url = process.argv[2];

if (!url) {
    console.error("❌ ERROR: Please provide a target URL.");
    console.log("Usage: npm start \"https://jobs.lever.co/...\"");
    process.exit(1);
}

const runEngine = (engine) => {
    console.log(`\n🚀 [ROUTER] Detected ${engine.toUpperCase()} architecture. Launching engine...`);
    const child = spawn('node', [`auto-fill-${engine}.mjs`, url], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code));
};

if (url.includes('lever.co')) {
    runEngine('lever');
} else if (url.includes('greenhouse.io') || url.includes('gh_jid=')) {
    runEngine('greenhouse');
} else if (url.includes('ashbyhq.com')) {
    runEngine('ashby');
} else {
    console.error(`\n❌ [ROUTER] Unsupported or unmapped ATS architecture for: ${url}`);
    console.log("Currently supported: Lever, Greenhouse (inc. custom domains via ?gh_jid=), Ashby HQ");
    process.exit(1);
}


