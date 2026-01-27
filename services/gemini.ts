
import { GoogleGenAI } from "@google/genai";
// Fixed: Changed 'Expense' to 'Transaction' as 'Expense' does not exist in types.ts
import { Transaction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fixed: Changed parameter type from 'Expense[]' to 'Transaction[]'
export async function getFinancialInsights(expenses: Transaction[]) {
  const summary = expenses.map(e => `${e.category}: $${e.amount}`).join(', ');
  const prompt = `Based on these expenses: ${summary}, give me 3 short, punchy iOS-style financial tips (10 words max each). Focus on optimization and saving. Return as a plain list.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correctly accessing .text property (not a method)
    return response.text?.split('\n').filter(line => line.trim().length > 0).slice(0, 3) || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Track your coffee spend.", "Check for unused subscriptions.", "Save 10% more this month."];
  }
}
