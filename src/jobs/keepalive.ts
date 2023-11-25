import {createRequire} from 'node:module';
import {Job} from './job';
import {Client} from "discord.js";
import {Logger} from "../services";
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

// API Req to render to prevent sleep
export class Keepalive implements Job {
    public name = 'Keepalive';
    public schedule: string = Config.jobs.keepalive.schedule;
    public log: boolean = Config.jobs.keepalive.log;

    private url = `https://api.render.com`

    constructor(private client: Client) {
    }


    public async run(): Promise<void> {
        let auth = 'Bearer ' + process.env.render_api_key
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization: auth
            }
        };

        fetch('https://api.render.com/v1/services/srv-cl9c3lavokcc73efgo2g', options)
            .then(response => response.json())
            // .then(response => Logger.info(response))
            .catch(err => Logger.error(err));


    }
}
