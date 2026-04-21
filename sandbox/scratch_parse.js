const fs = require('fs');

if (!fs.existsSync('missing_dom.json')) {
    console.log("No missing_dom.json found");
    process.exit(0);
}

const data = JSON.parse(fs.readFileSync('missing_dom.json', 'utf8'));
const stats = {};

for (const [url, elements] of Object.entries(data)) {
    let platform = "unknown";
    if (url.includes('lever.co')) platform = "Lever";
    if (url.includes('greenhouse.io')) platform = "Greenhouse";
    if (url.includes('ashbyhq.com')) platform = "Ashby";

    for (const elHTML of elements) {
        // basic classification
        let category = "Unknown";
        
        if (elHTML.includes('type="checkbox"') && elHTML.includes('gdpr')) category = "GDPR / Consent Checkbox";
        else if (elHTML.includes('type="checkbox"')) category = "Generic Checkbox";
        else if (elHTML.includes('_systemfield_email')) category = "Standard Email (_systemfield_email)";
        else if (elHTML.includes('_systemfield_name')) category = "Standard Name (_systemfield_name)";
        else if (elHTML.includes('type="tel"')) category = "Phone Number (type=tel)";
        else if (elHTML.includes('type="url"')) category = "Website/Portfolio (type=url)";
        else if (elHTML.includes('role="combobox"') || elHTML.includes('select__input')) category = "React-Select / Dropdown";
        else if (elHTML.includes('type="text"') && elHTML.includes('placeholder="Type here..."')) category = "Custom Required Text Answer";
        else if (elHTML.includes('type="text"')) category = "Generic Text Input";
        else if (elHTML.includes('textarea')) category = "Textarea";
        else if (elHTML.includes('type="radio"')) category = "Radio Button";
        
        let key = `${platform} - ${category}`;
        if (!stats[key]) stats[key] = { count: 0, example: elHTML.substring(0, 80) + "..." };
        stats[key].count++;
    }
}

const sorted = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
console.log("CATEGORY | COUNT | EXAMPLE DOM SIPPET");
for (const [k, v] of sorted) {
    console.log(`${k} | ${v.count} | ${v.example}`);
}
