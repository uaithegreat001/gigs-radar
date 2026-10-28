import { connectDb, closeDb, createIndexes, savePost, filterNewPost } from '../db.js';

const postA = {
  postId: 'testing-1',
  title: 'hiring web developers',
  subreddit: 'forhire',
  tier: 1,
};
const postB = {
  postId: 'testing-2',
  title: 'hiring web developers',
  subreddit: 'remotejobs',
  tier: 2,
};

let collection;

try {
  collection = await connectDb();
  console.log('Connected. Records:', await collection.estimatedDocumentCount());

  await createIndexes(collection);
  const indexes = await collection.indexes();
  console.log('Indexes:', indexes.map((i) => i.name));

  // start by deleting any post in db
  await collection.deleteMany({ postId: { $in: ['testing-1', 'testing-2'] } });

  // Test 1: Post are new in db
  const test1 = await filterNewPost(collection, [postA, postB]);
  console.log('Test 1, expect 2:', test1.length);

  // Test 2: Save postA
  await savePost(collection, postA);
  const test2 = await filterNewPost(collection, [postA, postB]);
  console.log('Test 2, expect 1 (testing-2):', test2.length, test2.map((p) => p.postId));

  // Test 3: Saving postA again, which must not create a second record(that means unique)
  await savePost(collection, postA);
  const copies = await collection.countDocuments({ postId: 'testing-1' });
  console.log('Test 3, expect 1 record:', copies);

  // Test 4: Empty list return an empty list
  const test4 = await filterNewPost(collection, []);
  console.log('Test 4, expect 0:', test4.length);

  // Clean up any save data
  await collection.deleteMany({ postId: { $in: ['testing-1', 'testing-2'] } });
  console.log('Test records deleted');
} catch (error) {
  console.error('Test failed:', error);
  process.exitCode = 1;
} finally {
  await closeDb();
  console.log('db closed!');
}