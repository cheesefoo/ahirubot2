import {ImageAnnotatorClient} from '@google-cloud/vision';
import translate from 'deepl';
import {createRequire} from 'node:module';
import imageToBase64 from 'image-to-base64';
import {TranslationServiceClient} from "@google-cloud/translate";


const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');


export class ApiUtils {


    public static async GoogleTranslate(text: string): Promise<string> {
        let googleApiKey: string = process.env.google_privatekey;
        // console.error("BEFORE:"+googleApiKey)

        googleApiKey = googleApiKey.replace(/\\n/g, '\n');
        // await Logger.error(googleApiKey)
        // console.error("AFTER:"+googleApiKey)

        const options = {
            credentials: {client_email: process.env.google_email, private_key: googleApiKey},
        };
        let _projectId = `projects/ahirubot/locations/global`;
        const target = 'en-US';


        // let _googleTranslate = new TranslationServiceClient();
        let _googleTranslate = new TranslationServiceClient(options);
        const request = {
            contents:[text],
            targetLanguageCode: target,
            parent: _projectId
        };
        const response = await _googleTranslate.translateText(request);
        let [translations] = response;
        let [translation] = translations?.translations;
        let tl = translation.translatedText;


        return tl;
    }

    public static async OCRRequest(url: string): Promise<string> {
        let googleApiKey: string = process.env.google_privatekey;
        // console.error("BEFORE:"+googleApiKey)

        googleApiKey = googleApiKey.replace(/\\n/g, '\n');
        // await Logger.error(googleApiKey)
        // console.error("AFTER:"+googleApiKey)

        const options = {
            credentials: {client_email: process.env.google_email, private_key: googleApiKey},
        };
        const client = new ImageAnnotatorClient(options);
        const base64 = await imageToBase64(url)

        const request = {
            image: {
                content: `${base64}`
                // source: {
                // imageUri: `${url}`,
                // },
            },
            // "features": [{ "type": "TEXT_DETECTION" }],
            imageContext: {
                languageHints: ['JA'],
                textDetectionParams: {
                    enableTextDetectionConfidenceScore: 'true',
                },
            },
        };
        const requests = {
            requests: [request],
        };

        // @ts-ignore
        const [result] = await client.textDetection(request);
        let hasError = result?.error?.message;
        if (hasError) {
            throw hasError;
        }
        return result.fullTextAnnotation?.text;
    }

    public static async GetTranslation(text: string): Promise<string> {
        let resp = await translate({
            text: text,
            target_lang: 'EN',
            auth_key: process.env.deepl_key,
            free_api: true,
        });
        return await ApiUtils.ParseTranslations(resp.data.translations[0]);
    }

    public static async ParseTranslations(translations: {
        detected_source_language: string;
        text: string;
    }): Promise<string> {
        let srcLang = translations.detected_source_language;
        let text = translations.text;
        let tl = text;
        if (ApiUtils.IsEnglish(srcLang)) {
            tl = await translate({
                text: text,
                source_lang: 'EN',
                target_lang: 'JA',
                auth_key: process.env.deepl_key,
                free_api: true,
            })
                .then(resp => resp.data.translations[0].text)
                .catch(error => error.toString());
        }
        return tl;
    }

    private static IsEnglish(lang: string): boolean {
        return lang == 'EN' || lang == 'EN-US' || lang == 'EN-GB';
    }
}
