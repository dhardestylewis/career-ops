import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

(async () => {
    try {
        const jdPath = path.resolve('data/job_description.txt');
        if (!fs.existsSync(jdPath)) {
            console.error("No job description found at data/job_description.txt");
            process.exit(1);
        }

        const jdText = fs.readFileSync(jdPath, 'utf8').substring(0, 5000);
        const profileConfig = yaml.load(fs.readFileSync('config/profile.yml', 'utf8'));

        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

        if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
            console.log("No OPENAI_API_KEY or ANTHROPIC_API_KEY detected. Skipping generative cover letter.");
            process.exit(0);
        }

        const systemPrompt = `You are an aggressively practical, highly competent Machine Learning Engineer writing a cover letter.
        Your candidate profile:
        Name: ${profileConfig.candidate.full_name}
        Headline: ${profileConfig.narrative.headline}
        Superpowers: ${profileConfig.narrative.superpowers.join(", ")}
        Proof Points: ${profileConfig.narrative.proof_points.map(p => p.name + ": " + p.hero_metric).join(" | ")}
        
        Write a concise, plain-English, 3-paragraph maximum cover letter. NO BUZZWORDS. 
        Match your proof points directly to the core needs in the Job Description. DO NOT INCLUDE PLACEHOLDERS like [Date] or [Company Address].
        Start directly with 'Dear Hiring Team,' and sign off simply with your name. 
        Output ONLY the raw cover letter text.`;

        let generatedText = "";

        if (ANTHROPIC_API_KEY) {
            console.log("Calling Anthropic API...");
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages: [{ role: "user", content: `Here is the Job Description:\n${jdText}` }]
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            generatedText = data.content[0].text;
        } else {
            console.log("Calling OpenAI API...");
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Here is the Job Description:\n${jdText}` }
                    ]
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            generatedText = data.choices[0].message.content;
        }

        const escapeLatex = (str) => {
            return str
                .replace(/\\/g, '\\textbackslash ')
                .replace(/&/g, '\\&')
                .replace(/%/g, '\\%')
                .replace(/\$/g, '\\$')
                .replace(/#/g, '\\#')
                .replace(/_/g, '\\_')
                .replace(/\{/g, '\\{')
                .replace(/\}/g, '\\}')
                .replace(/~/g, '\\textasciitilde ')
                .replace(/\^/g, '\\textasciicircum ');
        };

        const safeText = escapeLatex(generatedText);

        const latexContent = `\\documentclass[11pt,letterpaper,sans]{moderncv}
\\moderncvstyle{casual}
\\moderncvcolor{red}
\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.75]{geometry}
\\name{Daniel}{Hardesty Lewis}
\\address{155 Claremont Ave}{New York, NY 10027}{United States}
\\phone[mobile]{+1~(713)~371-7875}
\\email{daniel@homecastr.com}
\\homepage{dlewis.ai}
\\social[linkedin]{dhardestylewis}
\\social[github]{dhardestylewis}
\\begin{document}
\\recipient{Hiring Manager}{Company}
\\date{\\today}
\\opening{Dear Hiring Team,}
\\closing{Sincerely,}
\\makelettertitle

${safeText.replace(/\n\n/g, '\\par\\vspace{1em}\n').replace(/\n/g, ' ')}

\\makeletterclosing
\\end{document}`;

        const texPath = path.resolve('data/dynamic_cover_letter.tex');
        fs.writeFileSync(texPath, latexContent, 'utf8');

        console.log("Compiling LaTeX natively via pdflatex...");
        execSync(`pdflatex -interaction=nonstopmode -output-directory="${path.resolve('data')}" "${texPath}"`, { stdio: 'inherit' });

        console.log("✅ Dynamic Cover Letter generated and compiled via pdflatex.");
        
        // -------------------------------------------------------------
        // DYNAMIC QA SYNTHESIS BLOCK
        // -------------------------------------------------------------
        const qsPath = path.resolve('data/unresolved_questions.json');
        if (fs.existsSync(qsPath)) {
            const rawQs = JSON.parse(fs.readFileSync(qsPath, 'utf8'));
            if (rawQs.length > 0) {
                console.log(`Detecting ${rawQs.length} custom text fields. Synthesizing bespoke answers...`);
                
                const qaSystemPrompt = `You are a highly capable AI Assistant answering custom application questions on behalf of ${profileConfig.candidate.full_name}.
Profile Data:
Headline: ${profileConfig.narrative.headline}
Superpowers: ${profileConfig.narrative.superpowers.join(", ")}
Background: ${profileConfig.narrative.exit_story}
Skills: ${profileConfig.narrative.skills.join(", ")}
Target Comp: ${profileConfig.compensation.minimum}

Task: Answer the following array of custom questions. 
Return ONLY a valid JSON object mapping the exact "id" of the question to your generated text answer. NO markdown blocks.
Example Output: {"field0": "I led infrastructure migration...", "field1": "$180,000"}
Be concise, direct, and aggressive. If a question asks for links (github/portfolio), just say "Attached in resume."`;

                const questionsMap = rawQs.map(q => `ID: ${q.id} | Question: ${q.question}`).join('\n');
                let qaJson = {};

                if (ANTHROPIC_API_KEY) {
                    const res = await fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
                        body: JSON.stringify({
                            model: "claude-3-haiku-20240307", max_tokens: 1000, system: qaSystemPrompt,
                            messages: [{ role: "user", content: `Questions to answer:\n${questionsMap}` }]
                        })
                    });
                    const data = await res.json();
                    if (data.content) {
                        try {
                            const rawStr = data.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                            qaJson = JSON.parse(rawStr);
                        } catch(e) { console.error("JSON Parse error on QA synthesis.", e); }
                    }
                } else {
                    const res = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
                        body: JSON.stringify({
                            model: "gpt-4o-mini",
                            messages: [
                                { role: "system", content: qaSystemPrompt },
                                { role: "user", content: `Questions to answer:\n${questionsMap}` }
                            ],
                            response_format: { type: "json_object" }
                        })
                    });
                    const data = await res.json();
                    if (data.choices) {
                         try {
                              qaJson = JSON.parse(data.choices[0].message.content);
                         } catch(e) {}
                    }
                }

                fs.writeFileSync(path.resolve('data/dynamic_answers.json'), JSON.stringify(qaJson, null, 2));
                console.log("✅ Dynamic QA Responses compiled and saved to dynamic_answers.json");
            }
        }

    } catch(e) {
        console.error("❌ Failed to generate dynamic synthesis:", e);
    }
})();
