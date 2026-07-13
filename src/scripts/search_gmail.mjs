import { loadGmailService } from './gmail-auth.mjs';

function parseArgs(argv) {
  const options = {
    maxResults: 10,
    json: false,
    queryParts: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--max-results' || value === '-n') {
      const next = Number(argv[i + 1]);
      if (Number.isFinite(next) && next > 0) {
        options.maxResults = next;
        i += 1;
      }
      continue;
    }

    options.queryParts.push(value);
  }

  options.query = options.queryParts.join(' ').trim();
  return options;
}

function readHeader(headers, name) {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function formatRow(item) {
  return [
    item.date,
    item.from,
    item.subject,
    item.threadId,
    item.id,
    item.snippet,
  ].join('\t');
}

const args = parseArgs(process.argv.slice(2));
const query = args.query || 'in:anywhere';
const { gmail, source } = loadGmailService();

const list = await gmail.users.threads.list({
  userId: 'me',
  q: query,
  maxResults: args.maxResults,
});

const threads = list.data.threads || [];
const items = [];

for (const threadRef of threads) {
  const thread = await gmail.users.threads.get({
    userId: 'me',
    id: threadRef.id,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject', 'Date', 'To'],
  });

  const messages = [...(thread.data.messages || [])].sort(
    (left, right) => Number(left.internalDate || 0) - Number(right.internalDate || 0)
  );
  const latest = messages.at(-1);
  const headers = latest ? latest.payload?.headers || [] : [];

  items.push({
    id: latest?.id || thread.data.id,
    threadId: thread.data.id || threadRef.id,
    date: readHeader(headers, 'Date'),
    from: readHeader(headers, 'From'),
    subject: readHeader(headers, 'Subject') || thread.data.snippet || '',
    snippet: thread.data.snippet || '',
  });
}

if (args.json) {
  console.log(JSON.stringify({ source, query, count: items.length, items }, null, 2));
} else {
  console.log(`Source: ${source}`);
  console.log(`Query: ${query}`);
  console.log(`Threads: ${items.length}`);
  for (const item of items) {
    console.log(formatRow(item));
  }
}
