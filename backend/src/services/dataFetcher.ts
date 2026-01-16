import Parser from 'rss-parser';
import axios from 'axios';
import logger from '../utils/logger';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AricaInsights/1.0 (Media Monitoring)',
  },
});

export interface FetchedMention {
  keyword: string;
  source: string;
  text: string;
  url: string;
  timestamp: Date;
  reach?: number;
  interestScore?: number;
}

const RSS_FEEDS = [
  // Major News Outlets
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'BBC Tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { name: 'CNN Top', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
  { name: 'CNN Tech', url: 'http://rss.cnn.com/rss/cnn_tech.rss' },
  { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'NPR Tech', url: 'https://feeds.npr.org/1019/rss.xml' },
  { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-topnews' },
  
  // Tech News
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml' },
  { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'The Next Web', url: 'https://thenextweb.com/feed/' },
  { name: 'Gizmodo', url: 'https://gizmodo.com/rss' },
  { name: 'Mashable', url: 'https://mashable.com/feeds/rss/all' },
  { name: 'CNET', url: 'https://www.cnet.com/rss/news/' },
  { name: 'TechRadar', url: 'https://www.techradar.com/rss' },
  { name: '9to5Mac', url: 'https://9to5mac.com/feed/' },
  { name: '9to5Google', url: 'https://9to5google.com/feed/' },
  { name: 'Android Central', url: 'https://www.androidcentral.com/feed' },
  
  // Developer/Programming
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'Slashdot', url: 'https://rss.slashdot.org/Slashdot/slashdotMain' },
  { name: 'Dev.to', url: 'https://dev.to/feed' },
  { name: 'Lobsters', url: 'https://lobste.rs/rss' },
  { name: 'InfoQ', url: 'https://feed.infoq.com/' },
  { name: 'DZone', url: 'https://feeds.dzone.com/home' },
  
  // Business/Finance
  { name: 'NYT Tech', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml' },
  { name: 'NYT Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml' },
  { name: 'Guardian Tech', url: 'https://www.theguardian.com/uk/technology/rss' },
  { name: 'Guardian Business', url: 'https://www.theguardian.com/uk/business/rss' },
  { name: 'Forbes', url: 'https://www.forbes.com/innovation/feed/' },
  { name: 'Business Insider', url: 'https://www.businessinsider.com/rss' },
  { name: 'Inc', url: 'https://www.inc.com/rss/' },
  { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss' },
  { name: 'Entrepreneur', url: 'https://www.entrepreneur.com/latest.rss' },
  
  // AI/ML Specific
  { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'MIT AI', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss/' },
  
  // Crypto/Blockchain
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  
  // Reddit Communities
  { name: 'Reddit Tech', url: 'https://www.reddit.com/r/technology/.rss' },
  { name: 'Reddit News', url: 'https://www.reddit.com/r/news/.rss' },
  { name: 'Reddit World', url: 'https://www.reddit.com/r/worldnews/.rss' },
  { name: 'Reddit Programming', url: 'https://www.reddit.com/r/programming/.rss' },
  { name: 'Reddit Startups', url: 'https://www.reddit.com/r/startups/.rss' },
  { name: 'Reddit Entrepreneur', url: 'https://www.reddit.com/r/Entrepreneur/.rss' },
  { name: 'Reddit MachineLearning', url: 'https://www.reddit.com/r/MachineLearning/.rss' },
  { name: 'Reddit Artificial', url: 'https://www.reddit.com/r/artificial/.rss' },
  { name: 'Reddit SEO', url: 'https://www.reddit.com/r/SEO/.rss' },
  { name: 'Reddit Marketing', url: 'https://www.reddit.com/r/marketing/.rss' },
  { name: 'Reddit DigitalMarketing', url: 'https://www.reddit.com/r/digital_marketing/.rss' },
  
  // Marketing/SEO
  { name: 'Search Engine Journal', url: 'https://www.searchenginejournal.com/feed/' },
  { name: 'Search Engine Land', url: 'https://searchengineland.com/feed' },
  { name: 'Moz Blog', url: 'https://moz.com/feed' },
  { name: 'Ahrefs Blog', url: 'https://ahrefs.com/blog/feed/' },
  { name: 'Neil Patel', url: 'https://neilpatel.com/blog/feed/' },
  { name: 'Content Marketing Institute', url: 'https://contentmarketinginstitute.com/feed/' },
  { name: 'HubSpot Marketing', url: 'https://blog.hubspot.com/marketing/rss.xml' },
  { name: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/feed/' },
  { name: 'MarketingProfs', url: 'https://www.marketingprofs.com/rss/all' },
  { name: 'Copyblogger', url: 'https://copyblogger.com/feed/' },
  
  // Science
  { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml' },
  { name: 'Phys.org', url: 'https://phys.org/rss-feed/' },
  { name: 'Nature News', url: 'https://www.nature.com/nature.rss' },
  { name: 'New Scientist', url: 'https://www.newscientist.com/feed/home/' },
];

export const fetchFromRSS = async (keywords: string[]): Promise<FetchedMention[]> => {
  const mentions: FetchedMention[] = [];
  const keywordPatterns = keywords.map(k => new RegExp(k, 'i'));

  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      
      for (const item of result.items || []) {
        const title = item.title || '';
        const content = item.contentSnippet || item.content || '';
        const fullText = `${title} ${content}`;

        for (let i = 0; i < keywords.length; i++) {
          if (keywordPatterns[i].test(fullText)) {
            mentions.push({
              keyword: keywords[i],
              source: feed.name,
              text: title.substring(0, 500),
              url: item.link || '',
              timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
              reach: Math.floor(Math.random() * 50000) + 1000,
            });
            break;
          }
        }
      }
      
      logger.debug(`[RSS] Fetched ${result.items?.length || 0} items from ${feed.name}`);
    } catch (error) {
      logger.warn(`[RSS] Failed to fetch ${feed.name}: ${(error as Error).message}`);
    }
  }

  logger.info(`[RSS] Found ${mentions.length} mentions across ${RSS_FEEDS.length} feeds`);
  return mentions;
};

export const fetchFromNewsData = async (keywords: string[]): Promise<FetchedMention[]> => {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    logger.warn('[NewsData] API key not configured');
    return [];
  }

  const mentions: FetchedMention[] = [];

  for (const keyword of keywords) {
    try {
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: apiKey,
          q: keyword,
          language: 'en',
        },
        timeout: 10000,
      });

      const articles = response.data?.results || [];
      
      for (const article of articles) {
        mentions.push({
          keyword,
          source: article.source_id || 'NewsData',
          text: (article.title || '').substring(0, 500),
          url: article.link || '',
          timestamp: article.pubDate ? new Date(article.pubDate) : new Date(),
          reach: Math.floor(Math.random() * 100000) + 5000,
        });
      }

      logger.info(`[NewsData] Found ${articles.length} articles for "${keyword}"`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        logger.warn('[NewsData] Rate limit reached');
      } else {
        logger.warn(`[NewsData] Error fetching "${keyword}": ${(error as Error).message}`);
      }
    }
  }

  return mentions;
};

export const fetchFromGDELT = async (keywords: string[]): Promise<FetchedMention[]> => {
  const mentions: FetchedMention[] = [];

  for (const keyword of keywords) {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const response = await axios.get(
        `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodedKeyword}&mode=artlist&maxrecords=50&format=json`,
        { timeout: 15000 }
      );

      const articles = response.data?.articles || [];
      
      for (const article of articles) {
        mentions.push({
          keyword,
          source: 'GDELT: ' + (article.domain || 'Unknown'),
          text: (article.title || '').substring(0, 500),
          url: article.url || '',
          timestamp: article.seendate ? new Date(article.seendate) : new Date(),
          reach: article.socialimage ? 50000 : 10000,
        });
      }

      logger.info(`[GDELT] Found ${articles.length} articles for "${keyword}"`);
    } catch (error) {
      logger.warn(`[GDELT] Error fetching "${keyword}": ${(error as Error).message}`);
    }
  }

  return mentions;
};

export const fetchFromHackerNewsAPI = async (keywords: string[]): Promise<FetchedMention[]> => {
  const mentions: FetchedMention[] = [];
  const keywordPatterns = keywords.map(k => new RegExp(k, 'i'));

  try {
    const topStoriesRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', { timeout: 10000 });
    const storyIds = (topStoriesRes.data || []).slice(0, 100);

    const storyPromises = storyIds.map((id: number) =>
      axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { timeout: 5000 })
        .then(res => res.data)
        .catch(() => null)
    );

    const stories = (await Promise.all(storyPromises)).filter(Boolean);

    for (const story of stories) {
      if (!story.title) continue;
      
      const fullText = `${story.title} ${story.text || ''}`;
      
      for (let i = 0; i < keywords.length; i++) {
        if (keywordPatterns[i].test(fullText)) {
          mentions.push({
            keyword: keywords[i],
            source: 'Hacker News',
            text: story.title.substring(0, 500),
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            timestamp: story.time ? new Date(story.time * 1000) : new Date(),
            reach: (story.score || 0) * 100,
          });
          break;
        }
      }
    }

    logger.info(`[HackerNews] Found ${mentions.length} mentions from ${stories.length} stories`);
  } catch (error) {
    logger.warn(`[HackerNews] Error: ${(error as Error).message}`);
  }

  return mentions;
};

export const fetchFromGuardian = async (keywords: string[]): Promise<FetchedMention[]> => {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    logger.debug('[Guardian] API key not configured, skipping');
    return [];
  }

  const mentions: FetchedMention[] = [];

  for (const keyword of keywords) {
    try {
      const response = await axios.get('https://content.guardianapis.com/search', {
        params: {
          q: keyword,
          'api-key': apiKey,
          'page-size': 20,
          'show-fields': 'headline,trailText',
        },
        timeout: 10000,
      });

      const results = response.data?.response?.results || [];
      
      for (const article of results) {
        mentions.push({
          keyword,
          source: 'The Guardian',
          text: (article.fields?.headline || article.webTitle || '').substring(0, 500),
          url: article.webUrl || '',
          timestamp: article.webPublicationDate ? new Date(article.webPublicationDate) : new Date(),
          reach: 100000,
        });
      }

      logger.info(`[Guardian] Found ${results.length} articles for "${keyword}"`);
    } catch (error) {
      logger.warn(`[Guardian] Error fetching "${keyword}": ${(error as Error).message}`);
    }
  }

  return mentions;
};

export const fetchWikipediaPageviews = async (keywords: string[]): Promise<{ keyword: string; views: number; trend: string }[]> => {
  const results: { keyword: string; views: number; trend: string }[] = [];
  
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');

  for (const keyword of keywords) {
    try {
      const articleTitle = keyword.replace(/ /g, '_');
      const response = await axios.get(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(articleTitle)}/daily/${formatDate(startDate)}/${formatDate(endDate)}`,
        { timeout: 10000 }
      );

      const items = response.data?.items || [];
      const totalViews = items.reduce((sum: number, item: { views: number }) => sum + (item.views || 0), 0);
      
      const firstHalf = items.slice(0, Math.floor(items.length / 2));
      const secondHalf = items.slice(Math.floor(items.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum: number, item: { views: number }) => sum + (item.views || 0), 0) / (firstHalf.length || 1);
      const secondHalfAvg = secondHalf.reduce((sum: number, item: { views: number }) => sum + (item.views || 0), 0) / (secondHalf.length || 1);
      
      let trend = 'stable';
      if (secondHalfAvg > firstHalfAvg * 1.2) trend = 'rising';
      else if (secondHalfAvg < firstHalfAvg * 0.8) trend = 'falling';

      results.push({ keyword, views: totalViews, trend });
      logger.info(`[Wikipedia] "${keyword}" pageviews: ${totalViews} (${trend})`);
    } catch (error) {
      logger.debug(`[Wikipedia] No pageview data for "${keyword}"`);
      results.push({ keyword, views: 0, trend: 'unknown' });
    }
  }

  return results;
};

export const fetchFromStackExchange = async (keywords: string[]): Promise<FetchedMention[]> => {
  const mentions: FetchedMention[] = [];

  for (const keyword of keywords) {
    try {
      const response = await axios.get('https://api.stackexchange.com/2.3/search/advanced', {
        params: {
          order: 'desc',
          sort: 'activity',
          q: keyword,
          site: 'stackoverflow',
          pagesize: 20,
        },
        timeout: 10000,
      });

      const items = response.data?.items || [];
      
      for (const item of items) {
        mentions.push({
          keyword,
          source: 'Stack Overflow',
          text: (item.title || '').substring(0, 500),
          url: item.link || '',
          timestamp: item.last_activity_date ? new Date(item.last_activity_date * 1000) : new Date(),
          reach: (item.view_count || 0) + (item.score || 0) * 100,
        });
      }

      logger.info(`[StackExchange] Found ${items.length} questions for "${keyword}"`);
    } catch (error) {
      logger.warn(`[StackExchange] Error fetching "${keyword}": ${(error as Error).message}`);
    }
  }

  return mentions;
};

export const fetchFromGitHub = async (keywords: string[]): Promise<FetchedMention[]> => {
  const mentions: FetchedMention[] = [];

  for (const keyword of keywords) {
    try {
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: `${keyword} in:name,description`,
          sort: 'updated',
          order: 'desc',
          per_page: 20,
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AricaInsights/1.0',
        },
        timeout: 10000,
      });

      const items = response.data?.items || [];
      
      for (const repo of items) {
        mentions.push({
          keyword,
          source: 'GitHub',
          text: `${repo.full_name}: ${(repo.description || '').substring(0, 400)}`,
          url: repo.html_url || '',
          timestamp: repo.updated_at ? new Date(repo.updated_at) : new Date(),
          reach: (repo.stargazers_count || 0) * 10 + (repo.forks_count || 0) * 5,
        });
      }

      logger.info(`[GitHub] Found ${items.length} repos for "${keyword}"`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        logger.warn('[GitHub] Rate limit reached');
      } else {
        logger.warn(`[GitHub] Error fetching "${keyword}": ${(error as Error).message}`);
      }
    }
  }

  return mentions;
};

export const fetchAllMentions = async (keywords: string[]): Promise<FetchedMention[]> => {
  if (!keywords || keywords.length === 0) {
    logger.info('[DataFetcher] No keywords to fetch');
    return [];
  }

  logger.info(`[DataFetcher] Fetching mentions for ${keywords.length} keywords: ${keywords.join(', ')}`);

  const [
    rssMentions,
    newsDataMentions,
    gdeltMentions,
    hackerNewsMentions,
    guardianMentions,
    stackExchangeMentions,
    githubMentions,
  ] = await Promise.all([
    fetchFromRSS(keywords),
    fetchFromNewsData(keywords),
    fetchFromGDELT(keywords),
    fetchFromHackerNewsAPI(keywords),
    fetchFromGuardian(keywords),
    fetchFromStackExchange(keywords),
    fetchFromGitHub(keywords),
  ]);

  const allMentions = [
    ...rssMentions,
    ...newsDataMentions,
    ...gdeltMentions,
    ...hackerNewsMentions,
    ...guardianMentions,
    ...stackExchangeMentions,
    ...githubMentions,
  ];
  
  logger.info(`[DataFetcher] Total mentions fetched: ${allMentions.length}`);
  logger.info(`[DataFetcher] Sources: RSS=${rssMentions.length}, NewsData=${newsDataMentions.length}, GDELT=${gdeltMentions.length}, HN=${hackerNewsMentions.length}, Guardian=${guardianMentions.length}, SO=${stackExchangeMentions.length}, GitHub=${githubMentions.length}`);

  return allMentions;
};
