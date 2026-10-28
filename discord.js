import { config } from "./configs.js";

const discordWebhookUrl = config.discordWebhookUrl;

// Helper to cut text length
function cutText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
}

// Coloring tiers tag
const tierColors = {
    1: parseInt('2ECC71', 16),
    2: parseInt('F1C40F', 16)
};
const defaultTierColor = parseInt('2B2D31', 16);

// Create discord post card
function discordEmbed(post) {
    return {
        title: cutText(post.title, 256),
        url: post.url,
        description: cutText(post.postBody, 300),
        color: tierColors[post.tier] || defaultTierColor,
        footer: {
            text: cutText(`Subreddit  ( r/${post.subreddit} )  \n${post.numberOfComments}  Comments  \nTier (${post.tier})`, 
                2048)
        }
    };
}

export async function sendPostToDiscord(post) {
    if (!discordWebhookUrl) throw new Error('Missing Discord webhook URL');

    // ( Wait = true ) This allow Discord send the message back, so we get the ID
    const separator = discordWebhookUrl.includes('?') ? '&' : '?';
    // URL Address to send to discord server 
    const url = `${discordWebhookUrl}${separator}wait=true`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [discordEmbed(post)]
            , 
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord Error ${response.status} : ${errorText}`);
    }

    const message = await response.json();
    return message.id;
}