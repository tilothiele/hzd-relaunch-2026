
process.env.STRAPI_BASE_URL = 'http://localhost:1337'
import { fetchNewsArticles } from '../lib/server/news-utils'

async function verifyTags() {
    console.log('Fetching news articles...')
    const articles = await fetchNewsArticles({ limit: 5 })

    console.log(`Fetched ${articles.length} articles.`)

    articles.forEach(article => {
        console.log(`Article: ${article.Headline}`)
        if (article.news_article_tags && article.news_article_tags.length > 0) {
            console.log('  Tags:', article.news_article_tags.map(t => `${t.Label} (${t.TagColorHexCode})`).join(', '))
        } else {
            console.log('  No tags found.')
            // Log the raw article object to see what fields are actually present
            console.log('  Raw article keys:', Object.keys(article))
            if ('news_article_tags' in article) {
                console.log('  news_article_tags value:', article.news_article_tags)
            } else {
                console.log('  news_article_tags field is MISSING')
            }
        }
        console.log('---')
    })
}

verifyTags().catch(console.error)
