export interface Review {
  id: string;
  userName: string;
  userImage: string;
  date: string;
  score: number;
  title: string;
  text: string;
  replyDate?: string;
  replyText?: string;
  version?: string;
  thumbsUp?: number;
}

export interface AnalysisResult {
  appId: string;
  appName: string;
  reviewCount: number;
  painIndex: {
    category: string;
    percentage: number;
    count: number;
  }[];
  explanations: {
    category: string;
    explanation: string;
    impact: string;
    quotes: string[];
  }[];
  competitorWeaknesses: {
    appName: string;
    weaknesses: string[];
    explanation: string;
  }[];
  competitorStrengths: {
    appName: string;
    strengths: string[];
    explanation: string;
    voltBayAction: string;
  }[];
  competitorMentions: {
    name: string;
    percentage: number;
    count: number;
    context: string;
  }[];
  opportunities: {
    title: string;
    description: string;
  }[];
  priorities: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  personas: {
    name: string;
    description: string;
    painPoints: string[];
    desires: string[];
  }[];
  roadmap: {
    phase: string;
    features: {
      title: string;
      effort: "Low" | "Medium" | "High";
      impact: "Low" | "Medium" | "High";
    }[];
  }[];
  marketPosition: {
    sentimentScore: number;
    perception: string;
    competitiveAdvantage: string;
  };
}

export const CATEGORIES = [
  "Charger reliability issues",
  "Payment or wallet issues",
  "App bugs or login errors",
  "Customer support complaints",
  "Missing charger information",
  "Charging speed complaints",
  "Pricing complaints",
  "Positive feedback",
  "Other issues"
];
