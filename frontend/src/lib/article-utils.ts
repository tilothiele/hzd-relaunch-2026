import { NewsArticle } from "@/types"

const formattedDateOfPublication = (article: NewsArticle) => {
    const d = article.DateOfPublication || article.publishedAt

    return formattedDate(d)

}

const formattedDate = (d: string | null | undefined) => {
    if (!d) {
        return null
    }

    return new Date(d).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

export { formattedDateOfPublication, formattedDate }