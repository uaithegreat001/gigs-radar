import fs from 'node:fs';
import { toPost, filterPosts } from '../reddit.js';

const rows = JSON.parse(fs.readFileSync('samples/post.data1', 'utf8'));

const posts = [];
for (const row of rows) {
  if (row.dataType !== 'post') continue;
  const post = toPost(row);
  if (post) posts.push(post);
}
console.log('Clean posts:', posts.length);

const kept = filterPosts(posts, 1791027000);
console.log('Kept after filter:', kept.length);
console.table(kept, ['title', 'tier', 'numberOfComments']);