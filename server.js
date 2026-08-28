import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const client = new Anthropic();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const SYSTEM_PROMPT = `You are a senior B2B SaaS case study writer with 15 years of experience in demand generation, revenue marketing, and editorial content. You specialise in writing compelling, humanised case studies that convert readers into pipeline.

Your writing style:
- Sounds like a senior journalist, not a PR team — no buzzwords, no fluff
- Opens with a punchy scene or tension-setting sentence, not "Company X was facing challenges"
- Uses short paragraphs (2–4 sentences max), varied sentence length, active voice
- Weaves in specific numbers naturally — never lists them robotically
- Includes one powerful pull quote that sounds like a real person said it, not a press release
- Closes with a forward-looking sentence that frames the customer as a market leader

SEO principles you follow:
- Lead with the primary transformation (e.g. "3× pipeline growth in 90 days")
- Use the main KPI metric in the H1 and first paragraph naturally
- Structure with clear H2 headings that answer searcher intent
- Aim for roughly 1000 words across 5–7 substantive sections

Output format — return ONLY a valid JSON array, nothing else before or after:
[
  {"type": "h1", "content": "..."},
  {"type": "h2", "content": "..."},
  {"type": "p",  "content": "..."},
  {"type": "quote", "content": "Quote text — First Last, Title, Company"},
  ...
]

Types available: h1 (one only, the headline), h2 (section headers), p (body paragraphs), quote (pull quotes, max 2).`;


function buildGeneratePrompt(a) {
  return `Write a ~1000-word case study from these briefing notes:

--- PROBLEM ---
Primary business problem: ${a.problem1}
Secondary problem / root cause: ${a.problem2}

--- SOLUTION ---
Features / capabilities that fixed Problem 1: ${a.solution1}
Features / workflow changes that fixed Problem 2: ${a.solution2}

--- RESULTS ---
2–3 verified KPIs: ${a.kpis}
Headline KPI before vs. after: ${a.beforeAfter}

--- TRANSFORMATION ---
How revenue motion changed since deployment: ${a.conclusion}

Return ONLY the JSON array. No markdown fences, no explanation.`;
}

function buildRefinePrompt(sections, feedback, a) {
  const draft = sections.map(s => `[${s.type.toUpperCase()}] ${s.content}`).join('\n\n');
  return `Here is the current draft:

${draft}

---
User feedback (apply these changes precisely):
${feedback}

Context for reference:
- Primary problem: ${a.problem1}
- Headline KPI before/after: ${a.beforeAfter}
- Conclusion narrative: ${a.conclusion}

Rewrite the full case study incorporating the feedback. Return ONLY the JSON array.`;
}

function extractJSON(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Model did not return a JSON array');
  return JSON.parse(match[0]);
}

app.post('/api/generate', async (req, res) => {
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildGeneratePrompt(req.body.answers) }],
    });
    res.json({ sections: extractJSON(msg.content[0].text) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/refine', async (req, res) => {
  try {
    const { sections, feedback, answers } = req.body;
    const msg = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildRefinePrompt(sections, feedback, answers) }],
    });
    res.json({ sections: extractJSON(msg.content[0].text) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Case Study Writer → http://localhost:${PORT}`));
