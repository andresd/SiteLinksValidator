import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


import * as express from 'express';
import * as puppeteer from 'puppeteer';
import cors = require('cors');
import { RuntimeOptions } from 'firebase-functions';
import { scrapeLinks } from './scrape';
import { crawl } from './crawler';

const app = express();

app.use(cors({ origin: true }));

// Runs before every route. Launches headless Chrome.
app.all('*', async (_req, res, next) => {
    // Note: --no-sandbox is required in this env.
    // Could also launch chrome and reuse the instance
    // using puppeteer.connect()
    console.log('EXECUTING');
    res.locals.browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    console.log('EXECUTING AFTER PUPP');

    next(); // pass control to next route.
});

// Handler to take screenshots of a URL.
app.get('/screenshot', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        res.status(400).send('Please provide a URL. Example: ?url=https://example.com');
    }
    const browser = res.locals.browser;
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const buffer = await page.screenshot({ fullPage: true });
        res.type('image/png').send(buffer);
    } catch (e) {
        res.status(500).send(e.toString());
    }
    await browser.close();
});

// Handler that prints the version of headless Chrome being used.
app.get('/version', async (req, res) => {
    try {
        console.log('VERSION');
        const browser = res.locals.browser;
        res.status(200).send(await browser.version());
        await browser.close();
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

app.get('/scrape', async (req, res) => {
    console.log('SCRAPE');
    const browser = res.locals.browser;
    try {
        const url = req.query.url;
        if (url === undefined || url === null || url === '') {
            res.status(422).send('Missing URL');
            return;
        }
        const page = await browser.newPage();
        const results = await scrapeLinks(url.toString(), page);
        await page.close();
        console.log('results', JSON.stringify(results));
        res.status(200).send(JSON.stringify(results));
    } catch (e) {
        res.status(500).send(e.toString());
    }
    await browser.close();
});

app.get('/crawl', async (req, res) => {
    console.log('CRAWL');
    const browser = res.locals.browser;
    const page = await browser.newPage();
    try {
        const url = req.query.url;
        const depth = req.query.depth ? +req.query.depth : 2;

        if (url === undefined || url === null || url === '') {
            res.status(422).send('Missing URL');
            return;
        }
        
        const results = await crawl(url.toString(), depth, page);
        console.log('results', JSON.stringify(results));
        res.status(200).send(JSON.stringify(results));
    } catch (e) {
        res.status(500).send(e.toString());
    }
    await page.close();
    await browser.close();
});

const opts: RuntimeOptions = { memory: '2GB', timeoutSeconds: 60 };
exports.scrapper = functions.runWith(opts).https.onRequest(app);
// exports.version = functions.https.onRequest(app);
// exports.scrape = functions.https.onRequest(app);