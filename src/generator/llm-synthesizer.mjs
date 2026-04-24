import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

export async function synthesizeAnswers(questions, jdText, profileConfig) {
    if (!questions || questions.length === 0) return {};

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
        console.log("[Synthesizer] No API keys found. Skipping dynamic generation.");
        return {};
    }

    const systemPrompt = `You are an aggressively practical, highly competent Staff Machine Learning Engineer applying for jobs.
Your candidate profile:
Name: ${profileConfig?.candidate?.full_name || 'Daniel Lewis'}
Headline: ${profileConfig?.narrative?.headline || 'Staff ML Engineer'}
Superpowers: ${(profileConfig?.narrative?.superpowers || []).join(", ")}
Proof Points: ${(profileConfig?.narrative?.proof_points || []).map(p => p.name + ": " + p.hero_metric).join(" | ")}

You will be given the Job Description and a list of specific ATS application questions that need answers.
Return a RAW JSON object mapping the question ID exactly to your synthesized string answer.
DO NOT wrap the response in markdown blocks. Just return the JSON dictionary. Keep answers concise, factual, and direct.`;

    const prompt = `Job Description:
${jdText.substring(0, 3000)}

Questions to Answer:
${questions.map(q => `ID: ${q.id} | Question: ${q.label}`).join('\n')}

Output JSON format: { "id1": "answer1", "id2": "answer2" }`;

    try {
        let generatedText = "";

        if (ANTHROPIC_API_KEY) {
            console.log(`[Synthesizer] Calling Anthropic API for ${questions.length} questions...`);
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
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            generatedText = data.content[0].text;
        } else {
            console.log(`[Synthesizer] Calling OpenAI API for ${questions.length} questions...`);
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
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            generatedText = data.choices[0].message.content;
        }

        generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(generatedText);
    } catch (e) {
        console.log(`[Synthesizer] Error generating answers: ${e.message}`);
        return {};
    }
}
