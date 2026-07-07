const portalId = '45417908';
const formId = process.argv[2] ?? '653c8cf2-fc9a-4d66-9bb4-8eaeb05cf292';
const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

const message = `Hi KIO Data Centers team,

KIO's data-center network across Mexico, Central America, the Caribbean, and Colombia stood out because interconnection, cloud demand, power resilience, and regional growth signals are becoming harder to forecast with static market views.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Mexico and LatAm data-center demand signals, interconnection-aware site risk, AI infrastructure markets, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, data-center, or strategy side you would point me toward?

Best,
Daniel`;

const payload = {
  submittedAt: Date.now().toString(),
  fields: [
    { name: 'firstname', value: 'Daniel' },
    { name: 'lastname', value: 'Lewis' },
    { name: 'email', value: 'daniel@homecastr.com' },
    { name: 'company', value: 'Homecastr' },
    { name: 'website', value: 'https://homecastr.com' },
    { name: 'motivo_de_contacto', value: 'Sales' },
    { name: 'subject', value: 'Mexico and LatAm data centers, interconnection, and market risk' },
    { name: 'message', value: message },
    { name: 'acepto_los_terminos_y_condiciones', value: 'true' },
  ],
  context: {
    pageUri: 'https://kiodatacenters.com/en/',
    pageName: 'KIO : Data Center EN',
  },
};

const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0',
  },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log(`status=${res.status}`);
console.log(body);

if (!res.ok) {
  process.exitCode = 1;
}
