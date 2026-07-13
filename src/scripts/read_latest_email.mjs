import { loadGmailService } from './gmail-auth.mjs';

(async () => {
  try {
    const { gmail, source } = loadGmailService();

    console.log(`Checking for recent emails... [source: ${source}]\n`);
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 3,
      q: 'is:inbox',
    });

    const messages = res.data.messages || [];
    if (messages.length === 0) {
      console.log('No recent messages found.');
      return;
    }

    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });
      const headers = msg.data.payload.headers;
      const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find((h) => h.name === 'Date')?.value || 'Unknown Date';
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Date: ${date}\n-------------------\n`);
    }
  } catch (err) {
    console.error('The API returned an error: ' + err);
  }
})();
