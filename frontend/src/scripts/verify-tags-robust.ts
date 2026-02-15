
const STRAPI_URL = 'http://127.0.0.1:1337/graphql';

const QUERY = `
query GetNewsArticles {
    newsArticles(sort: "publishedAt:desc", pagination: { limit: 5 }) {
        documentId
        Headline
        news_article_tags {
            Label
            TagColorHexCode
        }
    }
}
`;

async function verifyTagsDirectly() {
    console.log('Fetching news articles directly from GraphQL (' + STRAPI_URL + ')...');
    try {
        const response = await fetch(STRAPI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: QUERY }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
            return;
        }

        const articles = result.data.newsArticles;
        console.log(`Fetched ${articles.length} articles.`);

        if (articles.length === 0) {
            console.log('No articles found.');
        }

        articles.forEach((article: any) => {
            console.log(`Article: "${article.Headline}" (ID: ${article.documentId})`);
            if (article.news_article_tags && article.news_article_tags.length > 0) {
                console.log('  Tags:', article.news_article_tags.map((t: any) => `${t.Label} (${t.TagColorHexCode})`).join(', '));
            } else {
                console.log('  No tags found.');
                // console.log('  Full article object:', JSON.stringify(article, null, 2));
            }
            console.log('---');
        });

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

verifyTagsDirectly();
