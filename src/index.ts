import { Bot } from 'grammy';
import env from './utils/env';
import { homepage } from '../package.json';

const bot = new Bot(env.botToken);

const searchUrl = (query: string, lang?: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}&newwindow=1&hl=${lang}`;

bot.command(['start', 'help'], (ctx) => ctx.reply(`Hi! I'm a simple Google bot.

<blockquote expandable="true"><b>Basic Usage:</b>
/google &lt;query&gt; or /g &lt;query&gt; - Search for the query.

<b>Advanced Usage:</b>
Reply/Quote a message with /google or /g to search for it.
Type "@${bot.botInfo.username} \\&lt;query&gt;" to start inline searching.

The source code is available on <a href="${homepage}">GitHub</a>.
</blockquote>
`, {
    parse_mode: 'HTML',
    reply_parameters: {
        message_id: ctx.msg.message_id,
        allow_sending_without_reply: true,
    },
    link_preview_options: {
        is_disabled: true,
    },
}));

bot.command(['google', 'g'], async (ctx) => {
    // query in the command
    let query = ctx.msg.text?.split(' ').slice(1).join(' ');

    // query in the quote
    if (!query && ctx.msg.quote?.text) {
        query = ctx.msg.quote.text;
    }

    // query in the reply
    if (!query && ctx.msg.reply_to_message?.text) {
        query = ctx.msg.reply_to_message.text;
    }

    if (!query) {
        return ctx.reply('No query found.', {
            reply_parameters: {
                message_id: ctx.msg.message_id,
                allow_sending_without_reply: true,
            },
        });
    }

    // if the query is too long, trim it
    if (query.length > 256) {
        query = query.slice(0, 256);
    }

    const lang = ctx.from?.language_code;

    const url = searchUrl(query, lang);

    const text = `🔍 ${query}`;

    ctx.reply(text, {
        entities: [{ type: 'text_link', offset: 0, length: text.length, url }],
        reply_parameters: {
            message_id: ctx.msg.message_id,
            allow_sending_without_reply: true,
        },
        link_preview_options: {
            is_disabled: false,
            url,
            prefer_small_media: true,
        },
    });
});

bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;

    if (!query) {
        return ctx.answerInlineQuery([], {
            cache_time: 86400,
        });
    }

    const lang = ctx.from?.language_code;

    const url = searchUrl(query, lang);

    const text = `🔍 ${query}`;

    ctx.answerInlineQuery([
        {
            type: 'article',
            id: '0',
            title: text,
            description: 'Open Search Results',
            url,
            input_message_content: {
                message_text: text,
                entities: [{ type: 'text_link', offset: 0, length: text.length, url }],
                link_preview_options: {
                    is_disabled: false,
                    url,
                    prefer_small_media: true,
                },
            },
        },
        {
            type: 'article',
            id: '1',
            title: text,
            description: 'Send to Chat',
            input_message_content: {
                message_text: text,
                entities: [{ type: 'text_link', offset: 0, length: text.length, url }],
                link_preview_options: {
                    is_disabled: false,
                    url,
                    prefer_small_media: true,
                },
            },
        },
    ], {
        cache_time: 86400,
    });
});

bot.command('privacy', (ctx) => ctx.reply('This bot does not store any data. It only forwards the queries to Google. Use at your own risk.'));

bot.api.setMyCommands([
    { command: 'google', description: 'Search on Google' },
    { command: 'start', description: 'Start the bot' },
]).catch(console.error);

bot.catch((err) => console.error(err));

bot.start();
