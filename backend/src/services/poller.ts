import cron from 'node-cron';
import { User, Mention } from '../models';
import { fetchAllMentions, FetchedMention } from './dataFetcher';
import { analyzeSentiment, classifyTopics } from './aiProcessor';
import logger from '../utils/logger';
import { getIO } from '../socket/socketServer';

let isPolling = false;

const processMention = async (
  mention: FetchedMention,
  userId: string
): Promise<void> => {
  try {
    const existingMention = await Mention.findOne({
      userId,
      url: mention.url,
      keyword: mention.keyword,
    });

    if (existingMention) {
      return;
    }

    const [sentiment, topics] = await Promise.all([
      analyzeSentiment(mention.text),
      classifyTopics(mention.text),
    ]);

    const newMention = new Mention({
      userId,
      keyword: mention.keyword,
      source: mention.source,
      text: mention.text,
      url: mention.url,
      timestamp: mention.timestamp,
      aiSentiment: sentiment,
      aiTopics: topics,
      reach: mention.reach || 0,
      engagement: Math.floor(Math.random() * 1000),
    });

    await newMention.save();

    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('newMention', {
        id: newMention._id,
        keyword: newMention.keyword,
        source: newMention.source,
        text: newMention.text,
        url: newMention.url,
        timestamp: newMention.timestamp,
        aiSentiment: newMention.aiSentiment,
        aiTopics: newMention.aiTopics,
      });
    }
  } catch (error) {
    logger.error(`[Poller] Error processing mention: ${(error as Error).message}`);
  }
};

export const pollForAllUsers = async (): Promise<{ usersProcessed: number; mentionsAdded: number }> => {
  if (isPolling) {
    logger.warn('[Poller] Already polling, skipping...');
    return { usersProcessed: 0, mentionsAdded: 0 };
  }

  isPolling = true;
  let usersProcessed = 0;
  let mentionsAdded = 0;

  try {
    logger.info('[Poller] Starting poll cycle...');

    const users = await User.find({ keywords: { $exists: true, $ne: [] } });
    logger.info(`[Poller] Found ${users.length} users with keywords`);

    for (const user of users) {
      try {
        const keywords = user.keywords || [];
        if (keywords.length === 0) continue;

        logger.info(`[Poller] Fetching for user ${user.email} with ${keywords.length} keywords`);

        const mentions = await fetchAllMentions(keywords);
        
        const beforeCount = await Mention.countDocuments({ userId: user._id });

        for (const mention of mentions) {
          await processMention(mention, user._id.toString());
        }

        const afterCount = await Mention.countDocuments({ userId: user._id });
        const added = afterCount - beforeCount;
        mentionsAdded += added;

        logger.info(`[Poller] Added ${added} new mentions for user ${user.email}`);
        usersProcessed++;
      } catch (error) {
        logger.error(`[Poller] Error processing user ${user.email}: ${(error as Error).message}`);
      }
    }

    logger.info(`[Poller] Poll cycle complete. Users: ${usersProcessed}, Mentions added: ${mentionsAdded}`);
  } catch (error) {
    logger.error(`[Poller] Poll cycle error: ${(error as Error).message}`);
  } finally {
    isPolling = false;
  }

  return { usersProcessed, mentionsAdded };
};

export const pollForUser = async (userId: string): Promise<{ mentionsAdded: number }> => {
  let mentionsAdded = 0;

  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[Poller] User ${userId} not found`);
      return { mentionsAdded: 0 };
    }

    const keywords = user.keywords || [];
    if (keywords.length === 0) {
      logger.info(`[Poller] User ${userId} has no keywords`);
      return { mentionsAdded: 0 };
    }

    logger.info(`[Poller] Manual poll for user ${user.email} with ${keywords.length} keywords`);

    const mentions = await fetchAllMentions(keywords);
    const beforeCount = await Mention.countDocuments({ userId: user._id });

    for (const mention of mentions) {
      await processMention(mention, user._id.toString());
    }

    const afterCount = await Mention.countDocuments({ userId: user._id });
    mentionsAdded = afterCount - beforeCount;

    logger.info(`[Poller] Manual poll complete. Added ${mentionsAdded} mentions for user ${user.email}`);
  } catch (error) {
    logger.error(`[Poller] Manual poll error: ${(error as Error).message}`);
  }

  return { mentionsAdded };
};

export const startPolling = (): void => {
  const pollingInterval = process.env.POLLING_INTERVAL || '*/10 * * * *';
  const enablePolling = process.env.ENABLE_POLLING !== 'false';

  if (!enablePolling) {
    logger.info('[Poller] Polling disabled via ENABLE_POLLING=false');
    return;
  }

  logger.info(`[Poller] Starting scheduled polling with interval: ${pollingInterval}`);

  cron.schedule(pollingInterval, async () => {
    logger.info('[Poller] Scheduled poll triggered');
    await pollForAllUsers();
  });

  logger.info('[Poller] Polling scheduler started');
};
