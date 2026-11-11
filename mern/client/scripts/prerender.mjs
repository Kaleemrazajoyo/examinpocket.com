/**
 * Post-build prerender.
 *
 * A single-page app serves the same HTML for every URL, which leaves Google
 * with one indexable page. This script writes a real HTML file for every
 * public route (tabs, categories, individual MCQs) with:
 *   - a unique <title>, description, canonical and social preview tags
 *   - visible, crawlable content (heading, questions, answers, explanations)
 *   - a matching sitemap.xml
 *
 * React replaces the static block as soon as the app boots, so normal visitors
 * see the full interactive app. Crawlers and social preview bots read the HTML.
 *
 * Run: node scripts/prerender.mjs   (after `vite build`)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toSlug } from '../src/lib/seoPaths.js';

const SITE_URL = 'https://examinpocket.com';
const API_BASE = process.env.PRERENDER_API || 'https://api.examinpocket.com/api';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');

const TABS = [
    {
        path: '/',
        title: 'ExamInPocket.com - CSS, PMS, PCS, CCE & Competitive Exam Portal',
        description: 'Verified MCQs, solved past papers, Dawn vocabulary, editorial articles, timed mock tests and an AI tutor for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.',
        heading: 'Prepare for CSS, PMS, PCS, CCE & All Competitive Exams',
        intro: 'ExamInPocket.com brings verified MCQs, solved past papers, daily Dawn vocabulary, editorial articles, timed mock tests and an AI tutor together in one place for Pakistani competitive exam candidates.',
    },
    {
        path: '/mcqs',
        title: 'MCQs with Answers for CSS, PMS, PPSC and FPSC - ExamInPocket',
        description: 'Practice subject-wise MCQs with verified answers and explanations for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.',
        heading: 'MCQs with Answers for Competitive Exams',
        intro: 'Browse subject-wise multiple choice questions with verified answers and explanations. Pick a subject below to start practising.',
    },
    {
        path: '/mock-test',
        title: 'Free Timed Mock Test for CSS, PMS, PPSC, FPSC - ExamInPocket',
        description: 'Take free timed mock tests with instant scoring, question-by-question review and a weak-area diagnostic breakdown for CSS, PMS, PPSC, FPSC and CCE.',
        heading: 'Free Timed Mock Test',
        intro: 'Attempt a timed mock test, get instant scoring and see a subject-wise diagnostic breakdown that highlights your weak focus areas.',
    },
    {
        path: '/dawn-vocabulary',
        title: 'Daily Dawn Vocabulary with Urdu Meanings - ExamInPocket',
        description: 'Daily Dawn editorial vocabulary with Urdu meanings, usage sentences and national headlines for CSS, PMS and competitive exam candidates.',
        heading: 'Daily Dawn Editorial Vocabulary & Headlines',
        intro: 'High-yield vocabulary words with Urdu meanings, context sentences and daily national headlines for CSS and PMS candidates.',
    },
    {
        path: '/articles',
        title: 'CSS & PMS Editorial Articles and Essays - ExamInPocket',
        description: 'Read exam-oriented editorial articles, essays and current affairs analysis for CSS, PMS, PCS and CCE written papers.',
        heading: 'Editorial Articles and Essays',
        intro: 'Exam-oriented editorial articles, essays and current affairs analysis for CSS, PMS, PCS and CCE written papers.',
    },
    {
        path: '/library',
        title: 'Free PDF Notes and Books for CSS, PMS, PPSC - ExamInPocket',
        description: 'Download free PDF notes, solved past papers and reference books for CSS, PMS, PPSC, FPSC, SPSC and CCE preparation.',
        heading: 'PDF Notes & Books Library',
        intro: 'Download free PDF notes, solved past papers and reference books for CSS, PMS, PPSC, FPSC, SPSC and CCE preparation.',
    },
    {
        path: '/ai-tutor',
        title: 'AI Exam Tutor for CSS and PMS Preparation - ExamInPocket',
        description: 'Ask the ExamInPocket AI tutor for study plans, essay tips, current affairs guidance and MCQ explanations for CSS, PMS and competitive exams.',
        heading: 'AI Exam Tutor',
        intro: 'Ask the AI tutor for study plans, essay tips, current affairs guidance and step-by-step MCQ explanations.',
    },
];

// /saved is user-specific, so it is deliberately kept out of the sitemap.
const NOINDEX_PATHS = new Set(['/saved']);

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function absolute(p) {
    return `${SITE_URL}${p}`;
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
        const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.warn(`[prerender] could not load ${url}: ${error.message}`);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function setAttribute(html, attr, key, value) {
    const pattern = new RegExp(`(<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*?content=")[^"]*(")`);
    return html.replace(pattern, `$1${esc(value)}$2`);
}

function setCanonical(html, url) {
    let out = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);
    out = out.replace(/(<link rel="alternate" hreflang="en" href=")[^"]*(")/, `$1${esc(url)}$2`);
    out = out.replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, `$1${esc(url)}$2`);
    return out;
}

function applyMeta(html, { title, description, url, robots }) {
    let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
    out = setAttribute(out, 'name', 'description', description);
    out = setAttribute(out, 'property', 'og:title', title);
    out = setAttribute(out, 'property', 'og:description', description);
    out = setAttribute(out, 'property', 'og:url', url);
    out = setAttribute(out, 'name', 'twitter:title', title);
    out = setAttribute(out, 'name', 'twitter:description', description);
    if (robots) out = setAttribute(out, 'name', 'robots', robots);
    out = setCanonical(out, url);
    return out;
}

function applyStructuredData(html, { title, url, crumbs }) {
    const blockPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
    const match = html.match(blockPattern);
    if (!match) return html;

    let data;
    try {
        data = JSON.parse(match[1]);
    } catch {
        return html;
    }

    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
    const webpage = graph.find((node) => node['@type'] === 'WebPage');
    if (webpage) {
        webpage.url = url;
        webpage['@id'] = `${url}#webpage`;
        webpage.name = title;
    }

    if (Array.isArray(crumbs) && crumbs.length > 1) {
        graph.push({
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: crumbs.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
                item: absolute(crumb.path),
            })),
        });
    }

    const serialized = JSON.stringify(data, null, 2);
    return html.replace(blockPattern, `<script type="application/ld+json">\n${serialized}\n    </script>`);
}

function withContent(html, content) {
    return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

function pageShell(heading, intro, body) {
    return [
        '<div style="max-width:960px;margin:0 auto;padding:28px 20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0B1220;line-height:1.6">',
        `<h1 style="font-size:28px;margin:0 0 10px">${esc(heading)}</h1>`,
        intro ? `<p style="margin:0 0 20px;color:#334155">${esc(intro)}</p>` : '',
        body,
        '<p style="margin-top:28px;font-size:13px;color:#475569">ExamInPocket.com - MCQs, past papers, Dawn vocabulary, mock tests and an AI tutor for CSS, PMS, PCS, CCE, PPSC, FPSC and SPSC candidates in Pakistan.</p>',
        '</div>',
    ].join('\n');
}

function mcqBody(mcq, categoryName, slug) {
    const options = Array.isArray(mcq.options) ? mcq.options : [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const answer = options[mcq.answerIndex];
    const items = options
        .map((opt, i) => `<li>${esc(letters[i] || i + 1)}. ${esc(opt)}</li>`)
        .join('');

    return [
        `<p style="font-size:13px;color:#475569"><a href="/">Home</a> &rsaquo; <a href="/mcqs">MCQs</a> &rsaquo; ${slug ? `<a href="/mcqs/${slug}">${esc(categoryName)}</a>` : esc(categoryName)}</p>`,
        `<ol style="list-style:none;padding:0;margin:0 0 14px">${items}</ol>`,
        `<p style="margin:0 0 10px"><strong>Correct answer:</strong> ${esc(answer || '')}</p>`,
        mcq.explanation ? `<p style="margin:0"><strong>Explanation:</strong> ${esc(mcq.explanation)}</p>` : '',
        slug ? `<p style="margin-top:20px"><a href="/mcqs/${slug}">More ${esc(categoryName)} MCQs with answers &rarr;</a></p>` : '',
    ].join('\n');
}

function categoryList(mcqs) {
    return `<ul style="padding-left:18px;margin:0">${mcqs
        .map((mcq) => {
            const id = mcq._id || mcq.id;
            return `<li style="margin-bottom:8px"><a href="/mcq/${esc(id)}">${esc(mcq.question)}</a></li>`;
        })
        .join('')}</ul>`;
}

async function main() {
    const templatePath = path.join(DIST, 'index.html');
    const template = await readFile(templatePath, 'utf8');

    const [treeRes, mcqsRes] = await Promise.all([
        fetchJson(`${API_BASE}/categories/tree`),
        fetchJson(`${API_BASE}/mcqs?limit=500`),
    ]);

    const tree = Array.isArray(treeRes?.tree)
        ? treeRes.tree
        : Array.isArray(treeRes?.data?.tree)
            ? treeRes.data.tree
            : [];
    const mcqs = Array.isArray(mcqsRes?.items)
        ? mcqsRes.items
        : Array.isArray(mcqsRes?.data?.items)
            ? mcqsRes.data.items
            : Array.isArray(mcqsRes)
                ? mcqsRes
                : [];

    const categories = [];
    const seenSlugs = new Set();
    for (const main of tree) {
        if (!main?.name) continue;
        const mainSlug = toSlug(main.name);
        if (!seenSlugs.has(mainSlug)) {
            seenSlugs.add(mainSlug);
            categories.push({ name: main.name, slug: mainSlug, parent: null });
        }
        for (const child of main.children || []) {
            if (!child?.name) continue;
            const slug = toSlug(child.name);
            if (seenSlugs.has(slug)) continue;
            seenSlugs.add(slug);
            categories.push({ name: child.name, slug, parent: main.name });
        }
    }

    // Category names that only exist on MCQ documents (legacy data).
    for (const mcq of mcqs) {
        for (const name of [mcq.mainCategory, mcq.category, mcq.subCategory]) {
            if (!name) continue;
            const slug = toSlug(name);
            if (!slug || seenSlugs.has(slug)) continue;
            seenSlugs.add(slug);
            categories.push({ name, slug, parent: null });
        }
    }

    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
    const categoryLinks = categories
        .map((category) => `<li style="margin-bottom:6px"><a href="/mcqs/${category.slug}">${esc(category.name)} MCQs</a></li>`)
        .join('');

    const routes = [];
    const noindexRoutes = new Set();
    const write = async (routePath, html, indexable = true) => {
        const relative = routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}/index.html`;
        const target = path.join(DIST, relative);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, html, 'utf8');
        routes.push(routePath);
        if (!indexable) noindexRoutes.add(routePath);
    };

    // Tab pages.
    for (const tab of TABS) {
        const url = absolute(tab.path);
        let body = '';
        if (tab.path === '/mcqs') body = `<ul style="padding-left:18px">${categoryLinks}</ul>`;
        if (tab.path === '/') body = `<h2 style="font-size:20px">Browse MCQs by subject</h2><ul style="padding-left:18px">${categoryLinks}</ul>`;

        let html = applyMeta(template, {
            title: tab.title,
            description: tab.description,
            url,
            robots: NOINDEX_PATHS.has(tab.path) ? 'noindex, follow' : null,
        });
        html = applyStructuredData(html, {
            title: tab.title,
            url,
            crumbs: tab.path === '/' ? [] : [{ name: 'Home', path: '/' }, { name: tab.heading, path: tab.path }],
        });
        html = withContent(html, pageShell(tab.heading, tab.intro, body));
        await write(tab.path, html);
    }

    // /saved: real file so the deep link works, but never indexed.
    {
        const url = absolute('/saved');
        const title = 'My Saved MCQs, Vocabulary and Books - ExamInPocket';
        let html = applyMeta(template, {
            title,
            description: 'Your saved MCQs, Dawn vocabulary, articles and books in one place.',
            url,
            robots: 'noindex, follow',
        });
        html = applyStructuredData(html, { title, url, crumbs: [] });
        html = withContent(html, pageShell('My Saved Items', 'Sign in to see your saved MCQs, vocabulary, articles and books.', ''));
        await write('/saved', html);
    }

    // Category pages.
    for (const category of categories) {
        const routePath = `/mcqs/${category.slug}`;
        const url = absolute(routePath);
        const title = `${category.name} MCQs with Answers - ExamInPocket`;
        const description = `Practice ${category.name} MCQs with verified answers and explanations for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.`.slice(0, 158);

        const items = mcqs.filter((mcq) =>
            [mcq.mainCategory, mcq.category, mcq.subCategory].filter(Boolean).some((name) => toSlug(name) === category.slug)
        );

        const body = items.length
            ? `<h2 style="font-size:20px">${esc(category.name)} MCQs with answers</h2>${categoryList(items)}`
            : '<p>Questions for this subject are being added. Browse the other subjects below.</p>';

        // A category with no questions yet is thin content: keep the URL alive
        // for users, but ask search engines not to index it.
        const indexable = items.length > 0;

        const crumbs = [{ name: 'Home', path: '/' }, { name: 'MCQs', path: '/mcqs' }];
        if (category.parent) crumbs.push({ name: category.parent, path: `/mcqs/${toSlug(category.parent)}` });
        crumbs.push({ name: category.name, path: routePath });

        let html = applyMeta(template, {
            title,
            description,
            url,
            robots: indexable ? null : 'noindex, follow',
        });
        html = applyStructuredData(html, { title, url, crumbs });
        html = withContent(html, pageShell(`${category.name} MCQs with Answers`, description, body));
        await write(routePath, html, indexable);
    }

    // Individual MCQ pages (permanent shareable deep links).
    for (const mcq of mcqs) {
        const id = mcq._id || mcq.id;
        if (!id) continue;

        const categoryName = mcq.subCategory || mcq.mainCategory || mcq.category || 'General';
        const slug = categoryBySlug.has(toSlug(categoryName)) ? toSlug(categoryName) : toSlug(mcq.mainCategory || '');
        const routePath = `/mcq/${id}`;
        const url = absolute(routePath);
        const options = Array.isArray(mcq.options) ? mcq.options : [];
        const answer = options[mcq.answerIndex] || '';
        const title = `${mcq.question} - ExamInPocket`;
        const description = `${mcq.question} Correct answer: ${answer}. ${mcq.explanation || ''}`.slice(0, 158);

        const crumbs = [{ name: 'Home', path: '/' }, { name: 'MCQs', path: '/mcqs' }];
        if (slug) crumbs.push({ name: categoryName, path: `/mcqs/${slug}` });
        crumbs.push({ name: 'Question', path: routePath });

        let html = applyMeta(template, { title, description, url });
        html = applyStructuredData(html, { title, url, crumbs });
        html = withContent(html, pageShell(mcq.question, `${categoryName} MCQ with verified answer and explanation.`, mcqBody(mcq, categoryName, slug)));
        await write(routePath, html);
    }

    // Sitemap: every public, unique route.
    const today = new Date().toISOString().slice(0, 10);
    const priority = (routePath) => (routePath === '/' ? '1.0' : routePath.startsWith('/mcq/') ? '0.6' : routePath.startsWith('/mcqs') ? '0.9' : '0.7');
    const sitemapRoutes = routes.filter((routePath) => !NOINDEX_PATHS.has(routePath) && !noindexRoutes.has(routePath)).sort();
    const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...sitemapRoutes.map((routePath) =>
            [
                '  <url>',
                `    <loc>${absolute(routePath)}</loc>`,
                `    <lastmod>${today}</lastmod>`,
                `    <changefreq>${routePath === '/' ? 'daily' : 'weekly'}</changefreq>`,
                `    <priority>${priority(routePath)}</priority>`,
                '  </url>',
            ].join('\n')
        ),
        '</urlset>',
        '',
    ].join('\n');
    await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');

    console.log(
        `[prerender] wrote ${routes.length} HTML pages (${sitemapRoutes.length} indexable) and a sitemap with ${sitemapRoutes.length} URLs`
    );
}

main().catch((error) => {
    // Never fail the deploy because of prerendering: the SPA still works.
    console.error('[prerender] skipped:', error.message);
    process.exit(0);
});
