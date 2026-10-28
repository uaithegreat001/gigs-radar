// if .env Values are missing
const required = ['APIFY_TOKEN', 'DISCORD_WEBHOOK_URL', 'MONGODB_URI', 'DATABASE_NAME',];

const missing = required.filter((key) => !process.env[key]);
if(missing.length) {
    throw new Error(`Missing env variables ${missing.join(', ')}`);
}

// Tier configuration
const tiers = {
    forhire: 1, 
    remotejobs: 1,
    remotejs: 2, 
    techjobs: 2, 
    hiring: 2
}

// Included keywords
const includeKeywords = [
    'hiring', 'developer', 'swe', 'engineer', 'freelance', 'contract',
    'remote', 'js', 'javascript', 'node', 'node.js', 'junior',
    'entry level', 'intern', 'internship', 'mern', 'express.js',
    'expressjs', 'mongodb', 'react', 'full stack', 'full-stack', 'fullstack',
    'sql', 'postgres', 'software', 'automation', 'software engineering'

];


// Excluded keywords
const excludedKeywords = [
'for hire', 'looking for work', 'seeking work', 'open to work', 'available for',
   'unpaid', 'offer', 'equity only', 'telegram', 'whatsapp', 'test task', 'how to get',
   'graphic designer'
]

// App Configurations
export const config = {
    apifyToken: process.env.APIFY_TOKEN,
    apifyActor: 'trudax~reddit-scraper-lite',
    mongodbUri: process.env.MONGODB_URI,
    dbName:process.env.DATABASE_NAME,
    tiers,
    defaultTier: 3,
    subreddit: Object.keys(tiers),
    maxAgeSeconds: ( 36 * 60 * 60 ),
    maxComments: 30,
    includeKeywords,
    excludedKeywords,
    maxCostUsd: 0.5,
    timeToLiveInSeconds: ( 2 * 24 * 60 * 60 ),
    // Discord configs
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    postsPerSubreddit: 10


}