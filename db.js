import { MongoClient } from "mongodb";
import { config } from "./configs.js";

let client;
// Open Connection
export async function connectDb() {
    try {
        if (!client) {
            client = new MongoClient(config.mongodbUri);
            await client.connect();
        }
        return client.db(config.dbName).collection('seen_posts');
    } catch (error) {
        client = undefined;
        throw error
    }
}

// Close Connection
export async function closeDb() {
    try {
        if (client) {
            await client.close();
            client = undefined;
        }

    } catch (error) {
        console.log(`Could'nt close MongoDb`, error.message);
        throw error;

    }
}

// Indexes of database
export async function createIndexes(collection) {
    await collection.createIndex({ postId: 1 }, { unique: true });
    await collection.createIndex({ savedAt: 1 }, { expireAfterSeconds: config.timeToLiveInSeconds });
}

// Save post to database
export async function savePost(collection, post) {
    try {
        const record = {
            postId: post.postId,
            title: post.title,
            subreddit: post.subreddit,
            tier: post.tier,
            savedAt: new Date()
        }
        await collection.insertOne(record);

    } catch (error) {
        if (error.code === 11000) return;
        throw error

    }

}

// Find post from database
export async function filterNewPost(collection, posts) {
    if (posts.length === 0) return [];

    // Get all ids from database 
    const ids = posts.map((post) => post.postId);

    // One query: which of these ids does the database already have?
    const seenRecords = await collection
        .find({ postId: { $in: ids } }, { projection: { postId: 1, _id: 0 } })
        .toArray();
    
    // Put the found ids in set
    const seen = new Set(seenRecords.map((data) => data.postId));

    // Keep only post that are new 
    return posts.filter((post) => !seen.has(post.postId));

}
