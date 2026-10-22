export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' })
	eleventyConfig.addPassthroughCopy({ 'src/css': 'css' })

	return {
		dir: {
			input: 'src',
			output: '_site',
			includes: '_includes',
			data: '_data',
		},
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
	}
}
