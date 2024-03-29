import {Client, TextChannel} from 'discord.js';
import {Video} from 'holodex.js';
import {io} from 'socket.io-client';

import {ApiUtils, MessageUtils} from '../utils';
import {Logger} from './logger';

export class Relay {
    public tldex;
    public subscribedVideos = [];
    public shouldRelay: Boolean = true;
    private broadcastCh = '722257568361087057';
    public blacklist : string[] = ['黒瀬浩介 / Kurose Kousuke']
    // private broadcastCh = '963848133475967086';//test
    private lastUpdateReceived;

    constructor(private client: Client) {
        this.start().then(() => Logger.info('relay created'));
    }
    public blacklistAdd(name:string){
        if(this.blacklist.includes(name))
            return;
        this.blacklist.push(name);
        console.log(this.blacklist);
    }

    public async start(): Promise<void> {

        this.tldex = io('wss://holodex.net', {
            path: '/api/socket.io/', transports: ['websocket'],
        });

        this.tldex.on('connect_error', err => Logger.error("CONNECT ERR: " + err));
        this.tldex.on('disconnect', err => {
            Logger.error("CONNECTION DISCONNECT: " + err);
            const subbedVids = this.subscribedVideos.length
            const vids = this.subscribedVideos.slice();
            this.subscribedVideos = [];

            for (let i = 0; i < subbedVids; i++) {
                this.setupLiveByVideoId(vids[i]);
            }
        });
        this.tldex.on("close", err => Logger.error("CONNECTION CLOSED: " + err));
        this.tldex.on('connect', () => {
            Logger.info('connected to socket');
        });
        this.tldex.on('subscribeSuccess', async msg => {

            Logger.info('subscribeSuccess ' + JSON.stringify(msg));
            let videoId = msg.id;
            this.subscribedVideos.push(videoId);
            Logger.info(`Relaying holodex TLs for ${msg.id}`);
            // await MessageUtils.send(ch, `Relaying holodex TLs for ${msg.id}`);

        });
        const retries: Record<string, number> = {};
        this.tldex.on('subscribeError', err => Logger.error("SUBSCRIBE ERROR!:" + err));
        this.tldex.onAny((evtName, ...args) => {

            if (!evtName.includes('/en') && evtName !== 'subscribeSuccess') {
                Logger.warn(evtName + ': ' + JSON.stringify(args));
            }
        });


    }

    public setupLive(live: Video): void {
        if (this.subscribedVideos.includes(live.videoId)) {
            return;
        }
        Logger.info(`setting up ${live.status} ${live.videoId} ${live.title}`);
        this.tldex.emit('subscribe', {video_id: live.videoId, lang: 'en'});
        let videoId = live.videoId;
        let ch = this.client.channels.cache.get(this.broadcastCh) as TextChannel;

        this.tldex.on(`${videoId}/en`, async msg => {
            Logger.info(`Received a message in ${videoId}: ${JSON.stringify(msg)}`);

            if (!this.shouldRelay)
                return;

            if (msg.name) {
                const cmt = {
                    id: msg.channel_id ?? 'MChad-' + (msg.name as string),
                    name: msg.name,
                    body: msg.message.replace(/:http\S+( |$)/g, ':'),
                    time: msg.timestamp,
                    isMod: msg.is_moderator,
                    isTl: msg.is_tl || msg.source === 'MChad',
                    isV: msg.is_vtuber,
                    isVerified: msg.is_verified,
                };
                if (this.blacklist.includes(cmt.name)) {
                    Logger.info(`filtered a blacklist person: ${cmt.name}`);
                    return;
                }
                if (cmt.isV || cmt.isTl || cmt.name == "Tales of YouTube Channel") {
                    let shorttime = cmt.time.toString().substring(0, 10);
                    let content = `<t:${shorttime}:t>\` ${cmt.name}: ${cmt.body}\``;
                    if (cmt.isV || cmt.name == "Tales of YouTube Channel") {
                        const emoji = ch.client.emojis.cache.find(e => e.name === 'deepl');
                        let tl = await ApiUtils.GetTranslation(cmt.body);
                        if (tl != undefined) {
                            tl = `${emoji}:${tl}`;
                        }
                        content = content.concat("\n", tl);

                    }
                    await MessageUtils.send(ch, content);
                }

            } else if (msg.type === 'end') {
                await MessageUtils.send(ch, 'おつヴぁる～ (Stream ended).');

            }
        });

    }

    public setupLiveByVideoId(live: string): void {
        if (this.subscribedVideos.includes(live)) {
            return;
        }
        Logger.info(`setting up ${live}`);
        this.tldex.emit('subscribe', {video_id: live, lang: 'en'});
    }
}
