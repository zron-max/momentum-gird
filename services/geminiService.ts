
import { GoogleGenAI } from "@google/genai";
import { Routine } from "../types";

// Safely access the API key from environment variables.
// This will be undefined if `process`, `process.env`, or the `API_KEY` itself is not available.
const API_KEY = typeof process !== "undefined" && process.env ? process.env.API_KEY : undefined;

let ai: GoogleGenAI | null = null;

// Initialize the AI client only if the API key is available.
if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI. AI features will be disabled.", error);
    ai = null; // Ensure ai is null if initialization fails.
  }
} else {
  // This warning is now accurate: the app won't crash, features will just be disabled.
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

export const generateRoutineFromAI = async (prompt: string): Promise<Pick<Routine, 'name' | 'subTasks'>> => {
  // Check if the AI client was successfully initialized before using it.
  if (!ai) {
    throw new Error("API key is not configured or AI service is unavailable.");
  }

  const fullPrompt = `Based on the following goal: "${prompt}", generate a relevant routine name and a list of 5 to 7 simple, actionable sub-tasks.
  Return the response as a single, valid JSON object with the structure: {"name": "Routine Name", "subTasks": ["Sub-task 1", "Sub-task 2", ...]}.
  Do not include any other text or markdown formatting outside of the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    if (parsedData.name && Array.isArray(parsedData.subTasks)) {
      return {
        name: parsedData.name,
        subTasks: parsedData.subTasks.map((taskName: string, index: number) => ({
          id: `ai-task-${Date.now()}-${index}`,
          name: taskName
        }))
      };
    } else {
      throw new Error("AI response did not match the expected format.");
    }
  } catch (error) {
    console.error("Error generating routine with AI:", error);
    throw new Error("Failed to generate routine. The AI may be experiencing issues.");
  }
};
