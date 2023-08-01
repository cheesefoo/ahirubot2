// const Twitter = require('twitter-v2');
import {createRequire} from 'node:module';
import {TwitterApi, TwitterV2IncludesHelper} from 'twitter-api-v2';
import {Logger} from '../services';
import {MessageUtils} from '../utils';
import {Job} from './job';

import {Client, TextChannel, User} from 'discord.js';
import {TwitterSpaceUtils} from '../utils/twitter-space-utils';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
let baseEndpoint = 'https://api.twitter.com/2/spaces/search';
// let testId = '1449090654542434308'
let testId = '313289241';
let subaId = '1027853566780698624';
let uimamaId = '69496975';
let broadcastChannel = '722257568361087057';
let broadcastChannel2 = '825378176993722378';
// let tweetChannel = '722253724835381300';
let tweetChannel = '870361524789723187';
let checks = [
    [subaId, broadcastChannel],
    // [uimamaId, broadcastChannel2],
];

/*
[2022-06-17 16:06:00.040] ERROR: An error occurred while running the 'Check Twitter' job.
shardId: 0
err: {
"type": "ApiRequestError",
"message": "Request failed.",
"stack":
Error: Request failed.
at RequestHandlerHelper.createRequestError (/workspace/node_modules/twitter-api-v2/dist/client-mixins/request-handler.helper.js:57:16)
at RequestHandlerHelper.requestErrorHandler (/workspace/node_modules/twitter-api-v2/dist/client-mixins/request-handler.helper.js:216:21)
at ClientRequest.emit (node:events:402:35)
at ClientRequest.emit (node:domain:475:12)
at TLSSocket.socketErrorListener (node:_http_client:447:9)
at TLSSocket.emit (node:events:390:28)
at TLSSocket.emit (node:domain:475:12)
at emitErrorNT (node:internal/streams/destroy:157:8)
at emitErrorCloseNT (node:internal/streams/destroy:122:3)
at processTicksAndRejections (node:internal/process/task_queues:83:21)
"error": true
}
 */

export class CheckTwitter implements Job {
    public name = 'Check Twitter';
    public schedule: string = Config.jobs.checkTwitter.schedule;
    public log: boolean = Config.jobs.checkTwitter.log;
    private _twitter;

    private _seen: string[] = [];

    constructor(private client: Client) {
        const twitter = new TwitterApi(process.env.twitter_token);
        this._twitter = twitter.readOnly
    }

    //subastream

    //test
    // private broadcastChannel = '825378176993722378';

    public async run(): Promise<void> {
        await this.Check();
    }

    private async Check() {

        for (const [id, channel] of checks) {
            // await this.checkSpace(id, channel);
            let tweets = await this._twitter.v1.userTimeline(id, {
                max_results: "5", 'tweet.fields': ['author_id', 'referenced_tweets'],
                expansions: ['author_id', 'referenced_tweets.id', 'in_reply_to_user_id', 'referenced_tweets.id.author_id']
            })
            const includes = new TwitterV2IncludesHelper(tweets);
            for (const tweet of tweets.tweets) {
                if (this._seen.includes(tweet.id)) {
                    continue;
                }
                let username = 'oozorasubaru';
                let msg = '';
                let tweetId = tweet.id
                const isRetweet = includes.retweet(tweet);
                if (isRetweet != null) {
                    let retweet = await this._twitter.v1.user(isRetweet.author_id)
                    username = retweet.data.username;
                    tweetId = isRetweet.id;
                    msg = 'Subaru retweeted this: '
                }
                this._seen.push(tweet.id)
                msg += `https://twitter.com/${username}/status/${tweetId}`;

                await MessageUtils.send(this.client.channels.cache.get(tweetChannel) as TextChannel, msg);
            }

        }
        Logger.trace(Logs.info.jobCompleted.replace('{JOB}', 'CheckTwitter'));
    }

    private async checkSpace(id: string, channel: string) {
        let endPt = `https://api.twitter.com/2/spaces/by/creator_ids?user_ids=${id}`;
        // let res = await twitter.get<Response>('spaces/by/creator_ids', {user_ids: id});
        let res = await this._twitter.v2.spacesByCreators(id);
        //There is a live space
        if (res['meta']['result_count'] == 0) {
            Logger.trace(Logs.info.nospace);
            return;
        }
        let spaceId = res['data'][0].id;
        let state = res['data'][0].state;
        try {
            //Check if we've seen it already
            if (this._seen.includes(spaceId)) {
                Logger.trace(Logs.info.spacesold.replace('{SC}', spaceId));
            } else {
                //New, post to discord
                this._seen.push(spaceId)
                let embed = await this.buildEmbed(spaceId);
                let ch: TextChannel = this.client.channels.cache.get(
                    channel
                ) as TextChannel;
                let metadata = await TwitterSpaceUtils.GetMetadata(spaceId);
                let url = await TwitterSpaceUtils.GetURL(metadata);
                let user: User = this.client.users.cache.get('118387143952302083');
                await MessageUtils.send(user, '@venndiagram#7498\n' + '`' + url + '`');
                await MessageUtils.send(ch, {embeds: [embed]});

            }
        } catch (error) {
            Logger.error(Logs.error.job.replace('{JOB}', 'CheckTwitter'), error);
        }

    }

    private async buildEmbed(spaceId) {
        let listenUrl = `https://twitter.com/i/spaces/${spaceId}`;
        console.log(listenUrl);

        let embed = {
            color: 0x1da1f2,

            title: `Subaru Twitter Space started!`,
            url: listenUrl,
        };
        return embed;
    }
}
