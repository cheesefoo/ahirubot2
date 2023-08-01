import {ApplicationCommandData, BaseCommandInteraction, Message, PermissionString} from 'discord.js';
import {HolodexApiClient} from 'holodex.js';
import {createRequire} from 'node:module';
import {LangCode} from '../models/enums';
import {EventData} from '../models/internal-models';
import {Lang} from '../services';
import {MessageUtils} from '../utils';
import {Command, CommandDeferType} from './command';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

// let template = require("../../static/template.png");

export class BlacklistCommand implements Command {
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = ['KICK_MEMBERS'];
    deferType: CommandDeferType;
    metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.blacklist'),
        description: Lang.getRef('commandDescs.blacklist', Lang.Default),
        options: [{
            name: 'text',
            description: 'ur subtitle',
            type: 3,
            required: true,
        }],
    };
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];
    private relayService;

    constructor(relayService) {
        this.relayService = relayService;
    }

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.blacklist', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.blacklist', langCode);
    }

    public async execute(intr: BaseCommandInteraction, data: EventData): Promise<void> {


    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        if (args.length === 2) {
            return;
        }
        let blacklistTarget: string = args.slice(2, args.length).join(' ');
        this.relayService.blacklistAdd(blacklistTarget);

        let reply = `ok`

        await MessageUtils.send(msg.channel, reply);
        return;


    }


}
