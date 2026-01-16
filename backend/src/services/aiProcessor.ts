import { HfInference } from '@huggingface/inference';
import logger from '../utils/logger';

type SentimentType = 'positive' | 'negative' | 'neutral';

let hfClient: HfInference | null = null;
let fallbackCount = 0;
let hfCallCount = 0;

const getHfClient = (): HfInference | null => {
  if (!hfClient && process.env.HF_TOKEN) {
    hfClient = new HfInference(process.env.HF_TOKEN);
  }
  return hfClient;
};

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'positive',
  'success', 'successful', 'win', 'winning', 'growth', 'profit', 'gain', 'improve',
  'improvement', 'better', 'best', 'love', 'happy', 'excited', 'breakthrough',
  'innovative', 'revolutionary', 'impressive', 'outstanding', 'remarkable',
  'surge', 'soar', 'boost', 'rise', 'rising', 'up', 'increase', 'record',
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'negative', 'fail', 'failure', 'failed',
  'loss', 'lose', 'losing', 'decline', 'drop', 'fall', 'falling', 'crash', 'crisis',
  'problem', 'issue', 'concern', 'worry', 'fear', 'risk', 'danger', 'threat',
  'scandal', 'controversy', 'lawsuit', 'investigation', 'fraud', 'hack', 'breach',
  'layoff', 'layoffs', 'cut', 'cuts', 'slash', 'plunge', 'tumble', 'sink',
];

const analyzeSentimentFallback = (text: string): SentimentType => {
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of POSITIVE_WORDS) {
    if (lowerText.includes(word)) positiveScore++;
  }

  for (const word of NEGATIVE_WORDS) {
    if (lowerText.includes(word)) negativeScore++;
  }

  if (positiveScore > negativeScore + 1) return 'positive';
  if (negativeScore > positiveScore + 1) return 'negative';
  return 'neutral';
};

export const analyzeSentiment = async (text: string): Promise<SentimentType> => {
  const client = getHfClient();
  
  if (!client) {
    fallbackCount++;
    return analyzeSentimentFallback(text);
  }

  try {
    hfCallCount++;
    
    const result = await client.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text.substring(0, 512),
    });

    if (result && result.length > 0) {
      const label = result[0].label.toLowerCase();
      if (label === 'positive' || label.includes('pos')) return 'positive';
      if (label === 'negative' || label.includes('neg')) return 'negative';
    }

    return 'neutral';
  } catch (error) {
    logger.warn(`[AI] Sentiment analysis failed, using fallback: ${(error as Error).message}`);
    fallbackCount++;
    return analyzeSentimentFallback(text);
  }
};

const TOPIC_CATEGORIES = [
  'technology', 'business', 'politics', 'science', 'health',
  'entertainment', 'sports', 'finance', 'environment', 'education',
  'security', 'ai', 'crypto', 'social media', 'startups',
];

const classifyTopicsFallback = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const topics: string[] = [];

  const topicKeywords: Record<string, string[]> = {
    technology: ['tech', 'software', 'hardware', 'computer', 'digital', 'app', 'device', 'gadget'],
    business: ['business', 'company', 'corporate', 'market', 'industry', 'enterprise', 'ceo', 'executive'],
    politics: ['politics', 'government', 'election', 'vote', 'congress', 'senate', 'president', 'policy'],
    science: ['science', 'research', 'study', 'discovery', 'scientist', 'experiment', 'lab'],
    health: ['health', 'medical', 'doctor', 'hospital', 'disease', 'treatment', 'vaccine', 'drug'],
    entertainment: ['movie', 'film', 'music', 'celebrity', 'actor', 'singer', 'show', 'concert'],
    sports: ['sports', 'game', 'team', 'player', 'championship', 'league', 'score', 'win'],
    finance: ['stock', 'invest', 'bank', 'money', 'fund', 'trading', 'wall street', 'financial'],
    environment: ['climate', 'environment', 'green', 'sustainable', 'carbon', 'pollution', 'renewable'],
    education: ['education', 'school', 'university', 'student', 'teacher', 'learning', 'college'],
    security: ['security', 'cyber', 'hack', 'breach', 'privacy', 'data protection', 'encryption'],
    ai: ['ai', 'artificial intelligence', 'machine learning', 'neural', 'chatgpt', 'openai', 'llm'],
    crypto: ['crypto', 'bitcoin', 'blockchain', 'ethereum', 'nft', 'defi', 'web3'],
    'social media': ['social media', 'twitter', 'facebook', 'instagram', 'tiktok', 'linkedin', 'viral'],
    startups: ['startup', 'founder', 'venture', 'funding', 'seed', 'series a', 'unicorn', 'vc'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        topics.push(topic);
        break;
      }
    }
  }

  return topics.length > 0 ? topics.slice(0, 3) : ['general'];
};

export const classifyTopics = async (text: string): Promise<string[]> => {
  const client = getHfClient();
  
  if (!client) {
    return classifyTopicsFallback(text);
  }

  try {
    const result = await client.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text.substring(0, 512),
      parameters: {
        candidate_labels: TOPIC_CATEGORIES,
        multi_label: true,
      },
    });

    // Handle the response which is an array of classification results
    if (result && Array.isArray(result) && result.length > 0) {
      const firstResult = result[0] as { labels?: string[]; scores?: number[] };
      if (firstResult.labels && firstResult.scores) {
        const topics: string[] = [];
        for (let i = 0; i < firstResult.labels.length && i < 3; i++) {
          if (firstResult.scores[i] > 0.3) {
            topics.push(firstResult.labels[i]);
          }
        }
        return topics.length > 0 ? topics : ['general'];
      }
    }

    return classifyTopicsFallback(text);
  } catch (error) {
    logger.warn(`[AI] Topic classification failed, using fallback: ${(error as Error).message}`);
    return classifyTopicsFallback(text);
  }
};

export const getAIStats = (): { hfCalls: number; fallbacks: number } => {
  return {
    hfCalls: hfCallCount,
    fallbacks: fallbackCount,
  };
};
