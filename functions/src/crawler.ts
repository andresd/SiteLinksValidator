//import got from 'got';

import { Page } from "puppeteer";
import { scrapeLinks } from './scrape';
import PQueue from 'p-queue';
import retry from 'p-retry';

// function linkToFilepath(link: string) {
//     const linkWithoutHost = link.replace(/https+:\/\//i, '')
//     const segments = linkWithoutHost.split('/')
//     let filepath = path.resolve(__dirname, 'sites', ...segments, 'index.html')
//     if (/\./g.test(segments[segments.length - 1])) {
//         filepath = path.resolve(__dirname, 'sites', ...segments)
//     }
//     return filepath
// }
 const asyncForEach = async (array: any[], callback: any) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

const crawlStep = async (url: string, step: number, depth: number, page: Page, seen: Set<string>, completed: Set<string>, queue: PQueue) => {
    console.log('crawlStep', url, step, depth, seen.size, completed.size)
    if (step === depth) {
        return;
    }
    const links = await scrapeLinks(url, page);

    console.log('crawlStep2');

    completed.add(url);

    await asyncForEach(links.filter((link: string) => !seen.has(link)), async (link: string) => {
        console.log('crawlStep3');
        seen.add(link);
        queue.add(() => retry((() => crawlStep(link, step++, depth, page, seen, completed, queue))));
    });


};
export const crawl = async (url: string, depth: number, page: Page ) => {
    const seen = new Set<string>();
    const completed = new Set<string>();
    const queue = new PQueue({ concurrency: 10, timeout: 60000 });

    queue.add(() => crawlStep(url, 0, depth, page, seen, completed, queue));

    await queue.onIdle();

    return {
        completed: [...completed],
        seen: [...seen]
    }
};

//async function crawl(link, { baseurl, seen = new Set(), completed = new Set(), queue = new PQueue({ concurrency: 10, timeout: 60000 }) }) {
    // const filepath = linkToFilepath(link)
    // if (exists(filepath)) return console.log('  ..exists', filepath)

    // console.log('🕸   crawling', link)
    // const { body } = await got.post(`http://localhost:3000/scrape`, {
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         url: link,
    //         elements: [{
    //             selector: `a[href^="/"],a[href^="${baseurl}"]`
    //         }],
    //         debug: { html: true }
    //     }),
    //     timeout: 10000
    // })
    // const json = JSON.parse(body)

    // save(link, json.debug.html)
    // completed.add(link)

    // console.log('✅  completed', link)

    // const links = json.data[0].results
    //     .filter(r => r.attributes.find(a => a.name === 'href'))
    //     .map(r => r.attributes.find(a => a.name === 'href').value)

    // links
    //     .filter(link => !link.startsWith('//'))
    //     .map(link => link.startsWith(baseurl) ? link : `${baseurl.replace(/\/$/, '')}${link}`)
    //     .filter(link => !/#.*$/.test(link))
    //     .filter(l => !seen.has(l))
    //     .forEach(l => {
    //         seen.add(l)
    //         queue.add(() => retry(() => crawl(l, { baseurl, seen, completed, queue })))
    //     })
    // console.log('seen urls', seen.size, ' ❍  completed', completed.size, ' ❍ queue size', queue.size, ' ❍ pending', queue.pending)
//}