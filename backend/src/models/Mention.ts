import mongoose, { Document, Schema } from 'mongoose';

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface IMention extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  keyword: string;
  source: string;
  text: string;
  url: string;
  timestamp: Date;
  aiSentiment: SentimentType;
  aiTopics: string[];
  reach?: number;
  engagement?: number;
  createdAt: Date;
  updatedAt: Date;
}

const mentionSchema = new Schema<IMention>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    aiSentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
      index: true,
    },
    aiTopics: {
      type: [String],
      default: [],
    },
    reach: {
      type: Number,
      default: 0,
    },
    engagement: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

mentionSchema.index({ userId: 1, timestamp: -1 });
mentionSchema.index({ userId: 1, keyword: 1 });
mentionSchema.index({ userId: 1, aiSentiment: 1 });
mentionSchema.index({ url: 1 }, { unique: true });

export const Mention = mongoose.model<IMention>('Mention', mentionSchema);
