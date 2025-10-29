import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function analyzeCycleData(cycleData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Analyze the following menstrual cycle data and provide insights and predictions:
  ${JSON.stringify(cycleData, null, 2)}
  
  Please provide:
  1. Average cycle length
  2. Predicted next period date
  3. Fertility window
  4. Any patterns or anomalies
  5. General health tips`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content: ", error);
    throw new Error("Failed to generate cycle analysis");
  }
}
