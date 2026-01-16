import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  keywords: [{ type: String }],
  preferences: {
    alertFrequency: { type: String, enum: ['realtime', 'daily', 'weekly'], default: 'realtime' },
    emailNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
  },
}, { timestamps: true });

const MentionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  keyword: { type: String, required: true },
  source: { type: String, required: true },
  text: { type: String, required: true },
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  aiSentiment: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
  aiTopics: [{ type: String }],
  reach: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Mention = mongoose.model('Mention', MentionSchema);

const SOURCES = [
  'BBC News', 'CNN', 'Reuters', 'TechCrunch', 'The Verge',
  'Wired', 'Ars Technica', 'The Guardian', 'New York Times',
  'Washington Post', 'Reddit', 'Twitter', 'LinkedIn', 'Medium', 'Forbes'
];

const TOPICS = [
  'technology', 'business', 'politics', 'science', 'health',
  'entertainment', 'sports', 'environment', 'finance', 'AI'
];

const SENTIMENTS: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];

const SAMPLE_TEXTS = {
  positive: [
    'Exciting breakthrough in AI technology promises to revolutionize healthcare',
    'Company reports record-breaking quarterly earnings, stock surges',
    'New sustainable energy solution receives widespread acclaim',
    'Innovative startup secures major funding round for expansion',
    'Customer satisfaction reaches all-time high according to survey',
  ],
  negative: [
    'Major data breach exposes millions of user records',
    'Company faces backlash over controversial policy changes',
    'Market downturn raises concerns among investors',
    'Product recall announced due to safety concerns',
    'Regulatory investigation launched into business practices',
  ],
  neutral: [
    'Company announces new product launch scheduled for next quarter',
    'Industry report highlights emerging market trends',
    'Executive leadership changes announced in press release',
    'Partnership agreement signed between major corporations',
    'Annual conference to feature keynote speakers from industry',
  ],
};

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMention(userId: mongoose.Types.ObjectId, keyword: string, daysAgo: number): {
  userId: mongoose.Types.ObjectId;
  keyword: string;
  source: string;
  text: string;
  url: string;
  timestamp: Date;
  aiSentiment: 'positive' | 'negative' | 'neutral';
  aiTopics: string[];
  reach: number;
  engagement: number;
} {
  const sentiment = randomElement(SENTIMENTS);
  const texts = SAMPLE_TEXTS[sentiment];
  const text = `${randomElement(texts)} - ${keyword}`;
  
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(randomNumber(0, 23), randomNumber(0, 59), randomNumber(0, 59));

  return {
    userId,
    keyword,
    source: randomElement(SOURCES),
    text,
    url: `https://example.com/article/${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp,
    aiSentiment: sentiment,
    aiTopics: [randomElement(TOPICS), randomElement(TOPICS)].filter((v, i, a) => a.indexOf(v) === i),
    reach: randomNumber(100, 100000),
    engagement: randomNumber(10, 5000),
  };
}

async function seed(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('MONGO_URI environment variable is required');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Mention.deleteMany({});
    console.log('Cleared existing data');

    const passwordHash = await bcrypt.hash('demo123', 10);
    const demoUser = await User.create({
      email: 'demo@aricainsights.com',
      passwordHash,
      keywords: ['AI', 'technology', 'startup', 'innovation', 'cloud'],
      preferences: {
        alertFrequency: 'realtime',
        emailNotifications: true,
        darkMode: false,
      },
    });
    console.log(`Created demo user: ${demoUser.email}`);

    const mentions: ReturnType<typeof generateMention>[] = [];
    const keywords = demoUser.keywords;

    for (let day = 0; day < 30; day++) {
      const mentionsPerDay = randomNumber(5, 20);
      
      for (let i = 0; i < mentionsPerDay; i++) {
        const keyword = randomElement(keywords);
        mentions.push(generateMention(demoUser._id as mongoose.Types.ObjectId, keyword, day));
      }
    }

    await Mention.insertMany(mentions);
    console.log(`Created ${mentions.length} sample mentions`);

    const sentimentCounts = mentions.reduce((acc, m) => {
      acc[m.aiSentiment] = (acc[m.aiSentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nSeed Summary:');
    console.log('─'.repeat(40));
    console.log(`Demo User: demo@aricainsights.com`);
    console.log(`Password: demo123`);
    console.log(`Keywords: ${keywords.join(', ')}`);
    console.log(`Total Mentions: ${mentions.length}`);
    console.log(`Sentiment Distribution:`);
    console.log(`  - Positive: ${sentimentCounts.positive || 0}`);
    console.log(`  - Negative: ${sentimentCounts.negative || 0}`);
    console.log(`  - Neutral: ${sentimentCounts.neutral || 0}`);
    console.log('─'.repeat(40));

    await mongoose.connection.close();
    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
