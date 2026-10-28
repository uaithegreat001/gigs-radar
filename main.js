import fs from 'node:fs';
import { config } from './configs.js';
import { connectDb, closeDb, createIndexes, savePost, filterNewPost } from './db.js';
import { sendPostToDiscord } from './discord.js';
import { fetchSubreddit, filterPosts, toPost } from './reddit.js';

// Helper: sleep for 1000s of every post
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Get posts from Apify
async function getPosts() {
 
  const allPosts = [];
  let failed = 0;
  for (const name of config.subreddit) {
    try {
      const posts = await fetchSubreddit(name, config.postsPerSubreddit);
      allPosts.push(...posts);
    } catch (error) {
      failed++;
      console.warn(`Could not fetch r/${name}: ${error.message}`);
    }
  }
  if (failed === config.subreddit.length) {
    throw new Error('Cannot pull data from Reddit');
  }
  return allPosts;
}

async function main() {
  try {
    const collection = await connectDb();
    await createIndexes(collection);

    const allPosts = await getPosts();
    console.log('Fetched:', allPosts.length);

    // Filter each posts
    const filtered = filterPosts(allPosts);
    console.log('After filter:', filtered.length);

    const unique = [...new Map(filtered.map((post) => [post.postId, post])).values()];
    const newPosts = await filterNewPost(collection, unique);
    console.log('New posts:', newPosts.length);

    if (newPosts.length === 0) {
      console.log('No new posts');
      return;
    }
    
    // Sort posts according to tiers
    newPosts.sort((a, b) => a.tier - b.tier || b.createdUtc - a.createdUtc);
    
    // Send post to discord and database
    let sent = 0;
    for (const post of newPosts) {
      await sendPostToDiscord(post);
      await savePost(collection, post);
      sent++;
      await sleep(1000);
    }
    console.log(`Sent ${sent} posts`);
  } catch (error) {
    console.error('Run failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

main();