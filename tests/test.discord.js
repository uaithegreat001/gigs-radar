import { sendPostToDiscord } from '../discord.js'; 

const fakePost = {
    title: '[Remote] [India] - Three YoE(DevSecOps) in MNC and Google Summer of Code Contributor.[Remote] [India] ',
    url: 'https://www.reddit.com/r/techjobs/comments/1wvifft/for_hire_remote_india_three_yoedevsecops_in_mnc/',
    postBody:'[Remote] [India] - Three YoE(DevSecOps) in MNC and Google Summer of Code Contributor.',
    subreddit: 'remoteJobs',
    numberOfComments: 3,
    tier: 1
};

try {
    const id = await sendPostToDiscord(fakePost);
    console.log('Sent! Message ID:', id);
} catch (error) {
    console.error('Failed:', error.message);
}