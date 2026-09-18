const fs = require('fs');
const path = require('path');

const NEWS_DIR = path.join(process.cwd(), 'news');
const OUTPUT = path.join(NEWS_DIR, 'news.json');

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
    if (match) return match[1].trim();
  }

  return '';
}

const files = fs.readdirSync(NEWS_DIR)
  .filter(file => file.endsWith('.html'));

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
  OUTPUT,
  JSON.stringify(articles, null, 2)
);

console.log(`Generated ${articles.length} news articles.`);
