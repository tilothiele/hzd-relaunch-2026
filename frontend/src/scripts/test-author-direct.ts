async function test() {
    const query = `
        query GetAuthorBySlug($slug: String!) {
            authors(filters: { Slug: { eq: $slug } }, pagination: { pageSize: 1 }) {
                documentId
                FirstName
                LastName
                DisplayName
                Slug
            }
        }
    `;
    const response = await fetch('http://127.0.0.1:1337/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query,
            variables: { slug: "mareike-busch" }
        })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

test();
