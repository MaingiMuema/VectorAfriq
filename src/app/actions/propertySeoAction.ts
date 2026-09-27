"use server";

import { Property } from "@/types";

export async function generateSeoDescription(properties: Property[]): Promise<{ text: string | null, error: string | null }> {
    if (!properties || properties.length === 0) {
        return { text: null, error: null };
    }

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return { text: null, error: "GROQ_API_KEY is not set in .env" };
        }

        // Prepare a concise list of properties to keep the prompt within reasonable limits
        const propertiesSummary = properties.map(p => ({
            title: p.title,
            type: p.type,
            location: p.location,
            price: p.price,
            bedrooms: p.bedrooms,
        })).slice(0, 10); // Limit to top 10

        const prompt = `Based on the following list of real estate properties, generate a single, compelling, and SEO-optimized paragraph describing the available properties. The description should highlight the variety, locations, and appeal of these properties to potential buyers or renters.
    
    Properties:
    ${JSON.stringify(propertiesSummary, null, 2)}
    
    Return ONLY the paragraph text without any formatting, quotes, or conversational filler.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert real estate SEO copywriter.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error calling AI API:", response.status, errorText);

            // Extract the message from API error if possible for cleaner debugging
            let finalErrorText = `API Error ${response.status}: ${errorText}`;
            try {
                const parsedError = JSON.parse(errorText);
                if (parsedError.error && parsedError.error.message) {
                    finalErrorText = `API Error: ${parsedError.error.message}`;
                }
            } catch (e) {
                // Not JSON
            }
            return { text: null, error: finalErrorText };
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content?.trim();

        if (!generatedText) {
            return { text: null, error: "AI returned empty response or unexpected format. Raw data: " + JSON.stringify(data) };
        }

        return { text: generatedText, error: null };
    } catch (error) {
        console.error("Failed to generate SEO description:", error);
        return { text: null, error: error instanceof Error ? error.message : String(error) };
    }
}
