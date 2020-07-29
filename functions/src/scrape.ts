import { Page } from 'puppeteer';

export const scrapeLinks = async (url: string, page: Page) => {

    console.log('scrapeLinks');

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
    } catch (e) {
        throw e;
    }

    // console.log('title', await page.title())
    // console.log('content', await page.content())

    //const selector = `a[href^="/"],a[href^="${baseUrl}"]`;

    const hrefs: any[] = await Promise.all((await page.$$('a')).map(async a => {
        return await (await a.getProperty('href')).jsonValue();
    }));
    
    console.log(JSON.stringify(hrefs), hrefs.length);

    return hrefs;

}