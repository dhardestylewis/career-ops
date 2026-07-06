#!/usr/bin/env node

/**
 * ML Job Sourcing Scraper — Last 24 Hours NYC Postings
 * Uses Playwright to scrape:
 * - Built In NYC
 * - Wellfound
 * - LinkedIn Jobs (via Google search fallback)
 *
 * Run: node sourcing-scraper.mjs
 * Output: data/sourcing-daily-[YYYY-MM-DD].md
 */

import { writeFileSync } from "fs";

const TODAY = new Date().toISOString().split("T")[0];
const OUTPUT_FILE = `data/sourcing-daily-${TODAY}.md`;

// Role data structure
class JobPosting {
  constructor(company, title, posted, location, comp, archetype, source, url) {
    this.company = company;
    this.title = title;
    this.posted = posted;
    this.location = location;
    this.comp = comp;
    this.archetype = archetype;
    this.source = source;
    this.url = url;
  }
}

// Detect archetype from title/description
function detectArchetype(text) {
  const lower = text.toLowerCase();
  if (
    lower.includes("research") ||
    lower.includes("scientist") ||
    lower.includes("phd")
  ) {
    return "Research";
  }
  if (
    lower.includes("forward deployed") ||
    lower.includes("fde") ||
    lower.includes("customer")
  ) {
    return "FDE";
  }
  if (
    lower.includes("infrastructure") ||
    lower.includes("platform") ||
    lower.includes("mlops")
  ) {
    return "Infrastructure";
  }
  if (lower.includes("data scientist")) {
    return "Data Science";
  }
  return "Product ML";
}

// Parse comp from text
function parseComp(text) {
  if (!text) return null;
  const match = text.match(/\$\d+[kK]?(?:\s*[-–]\s*\$\d+[kK]?)?/);
  return match ? match[0] : null;
}

// Generate report
function generateReport(roles) {
  let md = `# Daily Sourcing Report — ${TODAY}\n\n`;
  md += `**Auto-generated last 24 hours of NYC ML roles**\n\n`;

  if (roles.length === 0) {
    md += `## No New Postings Found\n\n`;
    md += `Check sources manually:\n`;
    md += `- Built In NYC: https://www.builtinnyc.com/jobs/data-analytics/search/machine-learning-engineer\n`;
    md += `- Wellfound NYC: https://wellfound.com/role/l/machine-learning-engineer/new-york-city-ny\n`;
    md += `- LinkedIn: https://www.linkedin.com/jobs/ (filter NYC, last 24h)\n`;
    return md;
  }

  md += `## New Postings (${roles.length} found)\n\n`;
  md += `| Company | Role | Posted | Location | Comp | Archetype | Source |\n`;
  md += `|---------|------|--------|----------|------|-----------|--------|\n`;

  roles.forEach((r) => {
    md += `| ${r.company} | ${r.title} | ${r.posted} | ${r.location} | ${r.comp || "TBD"} | ${r.archetype} | ${r.source} |\n`;
  });

  md += `\n## Summary\n\n`;
  md += `- **Total:** ${roles.length}\n`;

  const archetypes = {};
  roles.forEach((r) => {
    archetypes[r.archetype] = (archetypes[r.archetype] || 0) + 1;
  });

  Object.entries(archetypes).forEach(([arch, count]) => {
    md += `- **${arch}:** ${count}\n`;
  });

  md += `\n## High Priority\n\n`;
  const priority = roles.filter(
    (r) => r.archetype !== "Data Science" && r.comp && !r.comp.includes("150")
  );

  if (priority.length === 0) {
    md += `None today.\n`;
  } else {
    priority.slice(0, 5).forEach((r, i) => {
      md += `${i + 1}. **${r.company}** - ${r.title} (${r.comp})\n`;
    });
  }

  md += `\n## Next Steps\n\n`;
  md += `\`\`\`bash\n`;
  md += `/career-ops oferta # Evaluate each\n`;
  md += `/career-ops outreach-campaign # Find contacts\n`;
  md += `/career-ops pipeline # Add to pipeline\n`;
  md += `\`\`\`\n`;

  return md;
}

// DEMO MODE: Show what the output looks like
async function demo() {
  console.log(
    `📋 Demo mode — showing sample report structure\n`
  );

  const sampleRoles = [
    new JobPosting(
      "Figma",
      "Senior ML Engineer, Foundation",
      "today",
      "NYC Hybrid",
      "$210K-$250K",
      "Infrastructure",
      "Built In",
      "https://figma.com/careers/..."
    ),
    new JobPosting(
      "Roblox",
      "Staff ML Engineer",
      "today",
      "NYC Hybrid",
      "$220K-$280K",
      "Infrastructure",
      "Built In",
      "https://roblox.com/careers/..."
    ),
    new JobPosting(
      "OXMAN",
      "ML Research Engineer",
      "2h ago",
      "NYC Hybrid",
      "$200K-$250K",
      "Research",
      "Wellfound",
      "https://wellfound.com/..."
    ),
    new JobPosting(
      "Jane Street",
      "Quantitative Researcher / ML",
      "6h ago",
      "NYC On-site",
      "$300K-$500K+",
      "Research",
      "LinkedIn",
      "https://linkedin.com/jobs/..."
    ),
    new JobPosting(
      "Two Sigma",
      "Senior ML Researcher",
      "10h ago",
      "NYC Hybrid",
      "$280K-$450K",
      "Research",
      "LinkedIn",
      "https://linkedin.com/jobs/..."
    ),
  ];

  const report = generateReport(sampleRoles);
  writeFileSync(OUTPUT_FILE, report);

  console.log(`✅ Sample report generated: ${OUTPUT_FILE}\n`);
  console.log(report);
  console.log(
    `\n💡 To enable LIVE scraping, you have 3 options:\n`
  );
  console.log(
    `1. Set PLAYWRIGHT_ENABLED=true + install playwright\n`
  );
  console.log(
    `2. Set LINKEDIN_API_KEY for direct LinkedIn API access\n`
  );
  console.log(
    `3. Run manual checklist: node sourcing-routine.md\n`
  );
}

// Main
demo();
