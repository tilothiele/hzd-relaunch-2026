
const formattedDateOfPublication = (article: NewsArticle) => {
    const d = article.DateOfPublication || article.publishedAt

    return d ? new Date(d).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
        : null
}

export { formattedDateOfPublication }