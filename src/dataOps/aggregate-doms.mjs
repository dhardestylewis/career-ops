import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const SNAPSHOTS_DIR = path.join(process.cwd(), 'logs', 'snapshots');
const OUTPUT_FILE = path.join(process.cwd(), 'logs', 'dom_standardization_report.md');

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim()
        .replace(/\*/g, '') // remove required asterisks
        .trim();
}

function extractRelevantHtml($, el) {
    // If it's an input/select, try to grab its parent wrapper to show some context (like the control div)
    let wrapper = $(el).parent();
    
    // If it's a select2 or similar, go up a couple of levels to capture the complex structure
    if (wrapper.hasClass('select__input-container') || wrapper.hasClass('select__control')) {
        wrapper = wrapper.parent().parent();
    }
    
    if (wrapper.hasClass('input-wrapper') || wrapper.hasClass('field-wrapper')) {
        return $.html(wrapper);
    }
    
    return $.html(el);
}

function processFiles() {
    const files = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('_DOM.html'));
    console.log(`Found ${files.length} DOM snapshot files.`);

    // Map: Question Text -> Array of { company, html }
    const fieldRegistry = {};

    for (const file of files) {
        // e.g., databricks_job123_DOM.html -> databricks
        const company = file.split('_')[0];
        const filePath = path.join(SNAPSHOTS_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        
        const $ = cheerio.load(html);

        // Find all labels
        $('label').each((_, labelEl) => {
            const rawText = $(labelEl).text();
            const questionText = cleanText(rawText);
            
            if (!questionText || questionText.length < 2) return;

            // Find the associated input
            const forAttr = $(labelEl).attr('for');
            let inputHtml = null;

            if (forAttr) {
                // Find by ID
                const inputEl = $(`#${forAttr.replace(/([":\[\]\.\,])/g, '\\$1')}`);
                if (inputEl.length > 0) {
                    inputHtml = extractRelevantHtml($, inputEl);
                }
            } else {
                // Check if input is nested inside the label
                const inputEl = $(labelEl).find('input, select, textarea');
                if (inputEl.length > 0) {
                    inputHtml = extractRelevantHtml($, inputEl);
                }
            }

            // If we couldn't find an input by ID or nesting, maybe the structure is decoupled.
            // In that case, we grab the parent wrapper of the label and output it.
            if (!inputHtml) {
                let wrapper = $(labelEl).parent();
                if (wrapper.hasClass('input-wrapper') || wrapper.hasClass('field-wrapper')) {
                    inputHtml = $.html(wrapper);
                } else {
                    inputHtml = $.html(labelEl);
                }
            }

            if (!fieldRegistry[questionText]) {
                fieldRegistry[questionText] = [];
            }

            fieldRegistry[questionText].push({
                company,
                html: inputHtml,
                file
            });
        });
    }

    // Generate Markdown
    let md = `# Systematic DOM Standardization Tracker\n\n`;
    md += `This report aggregates how different companies render the exact same ATS questions in their HTML structure. This allows us to write deterministic, cross-company locators for our automation pipeline.\n\n`;

    // Sort questions by frequency
    const sortedQuestions = Object.keys(fieldRegistry).sort((a, b) => {
        return fieldRegistry[b].length - fieldRegistry[a].length;
    });

    for (const question of sortedQuestions) {
        const instances = fieldRegistry[question];
        
        // Skip generic one-offs unless they are important (heuristic: if it only appears once, maybe it's too specific, but we'll include all for completeness right now)
        
        md += `## Field: "${question}"\n`;
        md += `_Found ${instances.length} times_\n\n`;

        for (const instance of instances) {
            md += `### Company: ${instance.company.toUpperCase()} \n`;
            md += `Source: \`${instance.file}\`\n\n`;
            
            // Format HTML nicely
            // Cheerio output is minified-ish, let's just wrap it in code block
            const formattedHtml = instance.html
                .replace(/></g, '>\n<') // Add newlines between tags for readability
                .replace(/(<[^>]+>)/g, '  $1') // basic indent
                .trim();

            md += "```html\n";
            md += formattedHtml + "\n";
            md += "```\n\n";
        }
        
        md += `---\n\n`;
    }

    fs.writeFileSync(OUTPUT_FILE, md);
    console.log(`Generated report at: ${OUTPUT_FILE}`);
}

processFiles();
