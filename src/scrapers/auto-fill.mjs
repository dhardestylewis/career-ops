import { spawn } from 'child_process';

const getHostname = (value) => {
    try {
        return new URL(value).hostname.toLowerCase();
    } catch {
        return '';
    }
};

const isHostOrSubdomain = (value, domain) => {
    const host = getHostname(value);
    return host === domain || host.endsWith(`.${domain}`);
};

const url = process.argv[2];
const args = process.argv.slice(3);

if (!url) {
    console.error("❌ ERROR: Please provide a target URL.");
    console.log("Usage: npm start \"https://jobs.lever.co/...\" \"cv.pdf\"");
    process.exit(1);
}

const runEngine = (engine) => {
    console.log(`\n🚀 [ROUTER] Detected ${engine.toUpperCase()} architecture. Launching engine...`);
    const child = spawn('node', [`src/scrapers/auto-fill-${engine}.mjs`, url, ...args], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code));
};

if (isHostOrSubdomain(url, 'lever.co')) {
    runEngine('lever');
} else if (isHostOrSubdomain(url, 'greenhouse.io') || new URL(url).searchParams.has('gh_jid')) {
    runEngine('greenhouse');
} else if (isHostOrSubdomain(url, 'ashbyhq.com')) {
    runEngine('ashby');
} else {
    console.error(`\n❌ [ROUTER] Unsupported or unmapped ATS architecture for: ${url}`);
    console.log("Currently supported: Lever, Greenhouse (inc. custom domains via ?gh_jid=), Ashby HQ");
    process.exit(1);
}



