const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const NEWS_DIR = path.join(ROOT_DIR, 'news');

const NEWS_OUTPUT = path.join(NEWS_DIR, 'news.json');
const SITEMAP_OUTPUT = path.join(ROOT_DIR, 'sitemap.xml');

const SITE_URL = 'https://southpark.guide';


/* =========================================
   META TAG HELPER
========================================= */

function getMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`,
      'i'
    )
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  return '';
}


/* =========================================
   XML ESCAPING
========================================= */

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


/* =========================================
   FIND NEWS ARTICLES
========================================= */

const files = fs.readdirSync(NEWS_DIR)
  .filter(file => file.endsWith('.html'))
  .filter(file => file !== 'article-template.html');


/* =========================================
   GENERATE NEWS.JSON
========================================= */

const articles = files.map(file => {

  const html = fs.readFileSync(
    path.join(NEWS_DIR, file),
    'utf8'
  );

  return {

    title:
      getMeta(html, 'news:title') ||
      getMeta(html, 'og:title'),

    description:
      getMeta(html, 'og:description'),

    date:
      getMeta(html, 'article:published_time'),

    image:
      getMeta(html, 'news:image') ||
      getMeta(html, 'og:image'),

    category:
      getMeta(html, 'news:category') || 'News',

    url:
      `/news/${file.replace(/\.html$/, '')}`

  };

})
.filter(article => article.title && article.date)
.sort((a, b) => new Date(b.date) - new Date(a.date));


fs.writeFileSync(
  NEWS_OUTPUT,
  JSON.stringify(articles, null, 2) + '\n'
);

console.log(
  `Generated ${articles.length} news articles.`
);


/* =========================================
   GENERATE SITEMAP.XML
========================================= */

/*
  Find normal HTML pages in the root
  e.g. index.html, about.html, episodes.html
*/

const rootPages = fs.readdirSync(ROOT_DIR)
  .filter(file => file.endsWith('.html'))
  .filter(file => file !== '404.html')
  .map(file => {

    if (file === 'index.html') {
      return '/';
    }

    return `/${file.replace(/\.html$/, '')}`;

  });


/*
  Add all news articles
*/

const newsPages = files.map(file => {

  if (file === 'index.html') {
    return '/news/';
  }

  return `/news/${file.replace(/\.html$/, '')}`;

});


/*
  Combine pages and remove duplicates
*/

const urls = [
  ...new Set([
    ...rootPages,
    ...newsPages
  ])
];


/*
  Homepage first, everything else alphabetical
*/

urls.sort((a, b) => {

  if (a === '/') return -1;
  if (b === '/') return 1;

  return a.localeCompare(b);

});


/*
  Build XML
*/

const sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${xmlEscape(SITE_URL + url)}</loc>
  </url>`).join('\n')}
</urlset>
`;


/*
  Save sitemap.xml in site root
*/

fs.writeFileSync(
  SITEMAP_OUTPUT,
  sitemap
);

console.log(
  `Generated sitemap.xml with ${urls.length} URLs.`
);
