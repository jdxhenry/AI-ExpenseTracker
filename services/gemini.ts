
import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFinancialInsights(expenses: Transaction[]) {
  const summary = expenses.map(e => `${e.category}: $${e.amount}`).join(', ');
  const prompt = `Based on these expenses: ${summary}, give me 3 short, punchy iOS-style financial tips (10 words max each). Focus on optimization and saving. Return as a plain list.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.split('\n').filter(line => line.trim().length > 0).slice(0, 3) || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Track your coffee spend.", "Check for unused subscriptions.", "Save 10% more this month."];
  }
}