import { GoogleGenAI, Type } from "@google/genai";
import { Review, AnalysisResult, CATEGORIES } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeReviews(appName: string, appId: string, reviews: Review[]): Promise<AnalysisResult> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these ${reviews.length} reviews for the EV charging app "${appName}" (${appId}).
    
    Reviews:
    ${reviews.slice(0, 100).map(r => `[Rating: ${r.score}] ${r.text}`).join("\n\n")}
    
    Task:
    1. Categorize reviews into these categories: ${CATEGORIES.join(", ")}.
    2. Calculate the percentage distribution (Pain Index).
    3. For each category, provide a detailed explanation, impact, and 2 real example quotes from the reviews.
    4. Identify major weaknesses of this app.
    5. Identify key strengths and successful features of this app and other competitors mentioned.
    6. For each strength, suggest how VoltBay could incorporate similar successful features or strategies.
    7. Detect mentions of other EV charging apps (e.g., Zeon, PlugShare, ChargeZone, Tata Power, Statiq) and calculate their mention frequency.
    8. Generate 3 product opportunities for VoltBay based on these complaints.
    9. Generate a prioritized list of 4 features for VoltBay.
    10. Perform a SWOT analysis for this app.
    11. Identify 3 distinct user personas based on review patterns.
    12. Create a 3-phase product roadmap (MVP, Growth, Scale) for VoltBay to disrupt this competitor.
    13. Determine the overall market position, sentiment score (0-100), and key competitive advantage VoltBay should pursue.
    
    Return the result in JSON format following the AnalysisResult interface.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          appId: { type: Type.STRING },
          appName: { type: Type.STRING },
          reviewCount: { type: Type.NUMBER },
          painIndex: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                percentage: { type: Type.NUMBER },
                count: { type: Type.NUMBER }
              },
              required: ["category", "percentage", "count"]
            }
          },
          explanations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                explanation: { type: Type.STRING },
                impact: { type: Type.STRING },
                quotes: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["category", "explanation", "impact", "quotes"]
            }
          },
          competitorWeaknesses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                appName: { type: Type.STRING },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING }
              },
              required: ["appName", "weaknesses", "explanation"]
            }
          },
          competitorStrengths: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                appName: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
                voltBayAction: { type: Type.STRING }
              },
              required: ["appName", "strengths", "explanation", "voltBayAction"]
            }
          },
          competitorMentions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                percentage: { type: Type.NUMBER },
                count: { type: Type.NUMBER },
                context: { type: Type.STRING }
              },
              required: ["name", "percentage", "count", "context"]
            }
          },
          opportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          },
          priorities: { type: Type.ARRAY, items: { type: Type.STRING } },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
          },
          personas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                desires: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "description", "painPoints", "desires"]
            }
          },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phase: { type: Type.STRING },
                features: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      effort: { type: Type.STRING },
                      impact: { type: Type.STRING }
                    },
                    required: ["title", "effort", "impact"]
                  }
                }
              },
              required: ["phase", "features"]
            }
          },
          marketPosition: {
            type: Type.OBJECT,
            properties: {
              sentimentScore: { type: Type.NUMBER },
              perception: { type: Type.STRING },
              competitiveAdvantage: { type: Type.STRING }
            },
            required: ["sentimentScore", "perception", "competitiveAdvantage"]
          }
        },
        required: ["appId", "appName", "reviewCount", "painIndex", "explanations", "competitorWeaknesses", "competitorStrengths", "competitorMentions", "opportunities", "priorities", "swot", "personas", "roadmap", "marketPosition"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}
