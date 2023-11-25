import https from 'https';
import {createRequire} from 'node:module';
import {Job} from './job';
import {Client} from "discord.js";

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

// API Req to render to prevent sleep
export class Keepalive implements Job {
    public name = 'Keepalive';
    public schedule: string = Config.jobs.keepalive.schedule;
    public log: boolean = Config.jobs.keepalive.log;

    private url = `https://api.render.com/v1/services/srv-cl9c3lavokcc73efgo2g`

    constructor(private client: Client) {
    }


    public async run(): Promise<void> {
        const options :  https.RequestOptions = {
            hostname: this.url,
            method: 'GET',
            auth: process.env.render_api_key,
        };

        https.request(options, (res) => {
            if (res.statusCode == 200) {
                console.log('RENDER GET OK: 200');
            } else {
                console.error(`RENDER GET FAILED: ${res.statusCode}`
                );
            }
        }).on('error', (err) => {
            console.error('RENDER ERROR MAKING REQ', err.message);
        });
    }


}
