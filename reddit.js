import { config } from "./configs.js";



// Fetch data from Apify API
export async function fetchSubreddit(subreddit, limit) {

    // Required input data to scrape information about posts
    const input = {
        debugMode: false,
        ignoreStartUrls: false,
        includeMediaLinks: true,
        includeNSFW: false,
        maxComments: 0,
        maxCommunitiesCount: 1,
        maxItems: limit + 1,
        maxPostCount: limit,
        maxUserCount: 0,
        //postDateLimit: previousDate,
        navigationTimeout: 60,
        proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        scrollTimeout: 40,
        searchComments: false,
        searchCommunities: false,
        searchMedia: false,
        searchPosts: true,
        searchUsers: false,
        skipComments: true,
        skipCommunity: false,
        skipUserPosts: true,
        sort: 'new',
        startUrls: [{ url: `https://www.reddit.com/r/${subreddit}/new/` }],

    }

    // URL Address to fetch the posts data of every subreddit
    const url = `https://api.apify.com/v2/acts/${config.apifyActor}/run-sync-get-dataset-items?timeout=280&maxTotalChargeUsd=${config.maxCostUsd}&memory=1024`;

    console.log('Sending to Apify:', input.startUrls, input.maxPostCount);

    // Response the fetch data 
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apifyToken}`
        },
        body: JSON.stringify(input)
    });

    if (!response.ok) {
        throw new Error(`Apify request failed: HTTP ${response.status}`);
    }

    const items = await response.json();
    // Empty bucket for posts data
    const posts = [];
    let skipped = 0;

    // Loop over every post and save it to posts bucket
    for (const item of items) {
        if (item.dataType !== 'post') continue;

        const post = toPost(item);
        if (!post) {
            skipped++;
            continue;
        }
        posts.push(post);
    };

    // Get the posts that are skipped
    if (skipped > 0) {
        console.warn(`r/{subreddit}: ${skipped} post(s) skipped (missing data)`);
    }
    return posts;

}


// Function: Get required posts from data fetched
export function toPost(items) {
    const postId = items.parsedId;
    const title = items.title;
    const createdUtc = Math.floor(Date.parse(items.createdAt) / 1000);
    const url = items.url
    const numberOfComments = items.numberOfComments;
    const subreddit = (items.parsedCommunityName || '').toLowerCase();
    const postBody = items.body || '';

    // If required data are missing
    const missingData =
        !postId ||
        !title ||
        !url ||
        !subreddit ||
        !Number.isFinite(createdUtc) ||
        !Number.isFinite(numberOfComments);

    if (missingData) {
        return null;
    }

    // Return clean posts data
    return {
        postId, title, postBody, url, numberOfComments, subreddit, createdUtc
    }

};


// Helpers to check if `word` appear in a whole word
// ('swe' will not match inside answer)
function hasWord(text, word) {
    const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + safeWord + '(?![a-z0-9])').test(text);
}

// Filter the post 
export function filterPosts(posts, now = Math.floor(Date.now() / 1000)) {
    const kept = [];

    for (const post of posts) {

        // Post age check if it's above 24hr
        const ageSeconds = now - post.createdUtc;
        if (ageSeconds > config.maxAgeSeconds) continue;

        // Comment filtering if its > 30
        if (post.numberOfComments > config.maxComments) continue;


        // Included keywords matching
        const titleClean = post.title.toLowerCase().trim();
        const hasIncluded = config.includeKeywords.some((word) => hasWord(titleClean, word));
        if (!hasIncluded) continue;

        // Excluded keywords matching
        const hasExcluded = config.excludedKeywords.some((word) => hasWord(titleClean, word));
        if (hasExcluded) continue;


        const tier = config.tiers[post.subreddit] || config.defaultTier;

        // Push clean post to a list 
        kept.push({ ...post, tier });
    }

    return kept;
}



