import {RESTJSONErrorCodes as DiscordApiErrors} from 'discord-api-types/v9';
import {
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageEmbed,
    MessageOptions,
    MessageReaction,
    StartThreadOptions,
    TextBasedChannel,
    ThreadChannel,
    User,
} from 'discord.js';
import {EmbedUtils} from './embed-utils';
import {UrlUtils} from './url-utils';

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
];

export class MessageUtils {
    public static async send(
        target: User | TextBasedChannel,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions: MessageOptions =
                typeof content === 'string'
                    ? {content}
                    : content instanceof MessageEmbed
                        ? {embeds: [content]}
                        : content;
            return await target.send(msgOptions);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async reply(
        msg: Message,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions: MessageOptions =
                typeof content === 'string'
                    ? {content}
                    : content instanceof MessageEmbed
                        ? {embeds: [content]}
                        : content;
            return await msg.reply(msgOptions);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static content(msg: Message): string {
        return [
            msg.content,
            ...msg.embeds.filter(embed => !embed.provider).map(embed => EmbedUtils.content(embed)),
        ]
            .filter(Boolean)
            .join('\n');
    }

    public static async edit(
        msg: Message,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions: MessageOptions =
                typeof content === 'string'
                    ? {content}
                    : content instanceof MessageEmbed
                        ? {embeds: [content]}
                        : content;
            return await msg.edit(msgOptions);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async getEmbedUrl(msg: Message): Promise<string> {
        let embedUrl;
        msg.attachments.forEach(a => {
            let u = a.url;
            if (u !== undefined) {
                embedUrl = u;
                return;
            }
        });
        return embedUrl;
    }

    public static async getUrl(msg: Message, args: string[]): Promise<string> | undefined {
        //add delay cause discord/google is too slow/fast
        await new Promise(r => setTimeout(r, 3000));
        let url = await MessageUtils.getEmbedUrl(msg);
        if (url === undefined && UrlUtils.isValidHttpUrl(args[2])) {
            url = args[2];
        }
        return url;
    }

    public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction> {
        try {
            return await msg.react(emoji);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async pin(msg: Message): Promise<Message> {
        try {
            return await msg.pin();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async unpin(msg: Message): Promise<Message> {
        try {
            return await msg.unpin();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async startThread(
        msg: Message,
        options: StartThreadOptions
    ): Promise<ThreadChannel> {
        try {
            return await msg.startThread(options);
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async delete(msg: Message): Promise<Message> {
        try {
            return await msg.delete();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }


}
