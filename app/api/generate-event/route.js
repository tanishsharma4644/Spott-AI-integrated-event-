import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set. Set your API key in .env.local" },
        { status: 400 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are an event planning assistant. Generate event details based on the user's description.

CRITICAL: Return ONLY valid JSON with properly escaped strings. No newlines in string values - use spaces instead.

Return this exact JSON structure:
{
  "title": "Event title (catchy and professional, single line)",
  "description": "Detailed event description in a single paragraph. Use spaces instead of line breaks. Make it 2-3 sentences describing what attendees will learn and experience.",
  "category": "One of: tech, music, sports, art, food, business, health, education, gaming, networking, outdoor, community",
  "suggestedCapacity": 50,
  "suggestedTicketType": "free"
}

User's event idea: ${prompt}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- All string values must be on a single line with no line breaks
- Use spaces instead of \\n or line breaks in description
- Make title catchy and under 80 characters
- Description should be 2-3 sentences, informative, single paragraph
- suggestedTicketType should be either "free" or "paid"
`;

    const result = await model.generateContent(systemPrompt);

    const response = await result.response;
    const text = await response.text();

    // Clean the response (remove markdown code blocks if present)
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    console.log(cleanedText);

    let eventData;
    try {
      eventData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse model output as JSON:", parseErr, cleanedText);
      return NextResponse.json(
        { error: "Invalid response from model; could not parse JSON." },
        { status: 502 }
      );
    }

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error generating event:", error);

    const status = error?.status || (error?.code === 429 ? 429 : 500);
    const message = error?.message || String(error);

    // Try to extract retry delay (RetryInfo) from provider details if present
    let retryAfter;
    try {
      const details = error?.errorDetails || error?.details || [];
      for (const d of details || []) {
        const rd = d?.retryDelay || d?.retry_delay || d?.retry || (d && d["retryDelay"]);
        if (rd) {
          const m = String(rd).match(/(\d+)(?:\.\d+)?s/);
          if (m) {
            retryAfter = parseInt(m[1], 10);
            break;
          }
        }
        if (d?.['@type'] && String(d['@type']).includes('RetryInfo') && d?.retryDelay) {
          const m = String(d.retryDelay).match(/(\d+)(?:\.\d+)?s/);
          if (m) {
            retryAfter = parseInt(m[1], 10);
            break;
          }
        }
      }
    } catch (e) {
      // ignore extraction errors
    }

    if (status === 429 || /Quota exceeded|Too Many Requests/i.test(message)) {
      // Fallback: generate a simple event locally to keep UX smooth
      const { prompt } = await req.json().catch(() => ({ prompt: '' }));
      const p = (prompt || '').toLowerCase();
      const categories = [
        'tech','music','sports','art','food','business','health','education','gaming','networking','outdoor','community'
      ];
      const categoryHints = [
        { key: 'react|javascript|node|python|ai|ml|cloud|dev', cat: 'tech' },
        { key: 'concert|dj|band|sing|music', cat: 'music' },
        { key: 'football|soccer|cricket|run|marathon|sport', cat: 'sports' },
        { key: 'paint|gallery|art|design', cat: 'art' },
        { key: 'cook|chef|dine|food|cuisine', cat: 'food' },
        { key: 'startup|pitch|founder|business|sales|marketing', cat: 'business' },
        { key: 'wellness|yoga|fitness|health', cat: 'health' },
        { key: 'workshop|class|course|education|learn|bootcamp', cat: 'education' },
        { key: 'game|esports|gaming', cat: 'gaming' },
        { key: 'network|meetup|mixer|community|connect', cat: 'networking' },
        { key: 'hike|park|outdoor|nature', cat: 'outdoor' },
        { key: 'volunteer|community|ngo', cat: 'community' }
      ];
      let category = 'community';
      for (const h of categoryHints) {
        const re = new RegExp(h.key);
        if (re.test(p)) { category = h.cat; break; }
      }
      const paidHint = /paid|ticket|vip|pricing|fee|charge|premium/.test(p);
      const suggestedTicketType = paidHint ? 'paid' : 'free';
      const suggestedCapacity = /large|big|conference|summit|expo|festival/.test(p) ? 200 : 50;
      const titleBase = prompt?.trim() || 'Community Event';
      const title = titleBase.length > 80 ? titleBase.slice(0, 77) + '...' : titleBase;
      const description = `An engaging ${category} event generated locally due to API rate limits. Based on your idea: ${titleBase.replace(/\s+/g,' ')}. Refine details after creation to match your vision.`;

      const headers = {};
      if (retryAfter) headers['Retry-After'] = String(retryAfter);
      return NextResponse.json(
        { title, description, category, suggestedCapacity, suggestedTicketType },
        { status: 200, headers }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate event: ' + message },
      { status: 500 }
    );
  }
}