const fs = require('fs')
const path = require('path')

const translationDir = path.join(
	__dirname,
	'..',
	'node_modules',
	'@ckeditor',
	'strapi-plugin-ckeditor',
	'admin',
	'src',
	'translations'
)

if (!fs.existsSync(translationDir)) {
	process.exit(0)
}

const translations = {
	'ckeditor.label': 'CKEditor',
	'ckeditor.description': 'Der Rich-Text-Editor fuer jeden Anwendungsfall',
	'ckeditor.licenseKey.label': 'Lizenzschluessel',
	'ckeditor.licenseKey.description':
		'Noch keinen Lizenzschluessel? Besuchen Sie https://portal.ckeditor.com/checkout?plan=free.',
	'ckeditor.licenseKey.error.required':
		'Der CKEditor-Lizenzschluessel ist erforderlich.',
	'ckeditor.preset.label': 'Editor-Version waehlen',
	'ckeditor.preset.description': 'Werden mehr oder weniger Funktionen benoetigt?',
	'ckeditor.preset.light.label': 'Light-Version',
	'ckeditor.preset.standard.label': 'Standard-Version',
	'ckeditor.preset.rich.label': 'Rich-Version',
	'ckeditor.preset.error.required': 'Die Editor-Version ist erforderlich',
	'ckeditor.output.label': 'Ausgabeformat waehlen',
	'ckeditor.output.description':
		'Legt fest, ob die Ausgabe als HTML oder Markdown gespeichert wird',
	'ckeditor.output.html.label': 'HTML',
	'ckeditor.output.markdown.label': 'Markdown',
	'ckeditor.settings': 'Einstellungen',
	'ckeditor.required.label': 'Pflichtfeld',
	'ckeditor.required.description':
		'Ein Eintrag kann nicht erstellt werden, wenn dieses Feld leer ist',
	'ckeditor.maxLength.label': 'Maximale Laenge (Zeichen)',
}

fs.writeFileSync(
	path.join(translationDir, 'de.json'),
	`${JSON.stringify(translations, null, 2)}\n`
)
