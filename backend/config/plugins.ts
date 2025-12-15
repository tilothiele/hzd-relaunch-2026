export default ({env}) => ({
  'users-permissions': {
    enabled: true,
  },
  'hzd-plugin': {
    enabled: true,
    resolve: './src/plugins/hzd-plugin'
  },
 email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.example.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        // ... any custom nodemailer options
      },
      settings: {
        defaultFrom: env('SMTP_DEFAULT_FROM', 't.thiele@hovawarte.com'),
        defaultReplyTo:env('SMTP_DEFAULT_REPLY_TO', 't.thiele@hovawarte.com'),
      },
    },
  },
  // https://docs.strapi.io/cms/plugins/graphql
  graphql: {
    config: {
      landingPage: true
    }
  },
  tinymce: {
    enabled: true,
    config: {
        editor: {
            outputFormat: "html",
            tinymceSrc: "/tinymce/tinymce.min.js", // USE WITH YOUR PUBLIC PATH TO TINYMCE LIBRARY FOR USING SELF HOSTED TINYMCE
            editorConfig: {
                language: "de",
                license_key: "gpl",
                height: 500,
                menubar: false,
                extended_valid_elements: "span, img, small",
                forced_root_block: "",
                convert_urls: true,
                relative_urls: false,
                //base_url: "http://localhost:1337",

                // urlconverter_callback: (url) => {
                //     console.log(url)
				// 	if (!url) {
				// 		return url
				// 	}

				// 	return url.replace(/^\/\//, '/')
                // },
                entity_encoding: "raw",
                plugins:
                    "advlist autolink lists link image charmap preview anchor \
                    searchreplace visualblocks code fullscreen table emoticons nonbreaking \
                    insertdatetime media table code help wordcount",
                toolbar:
                    "undo redo | styles | bold italic forecolor backcolor | \
                    alignleft aligncenter alignright alignjustify | \
                    media table emoticons visualblocks code|\
                    nonbreaking bullist numlist outdent indent | removeformat | help",
                style_formats: [
                    {
                        title: "Headings",
                        items: [
                            { title: "h1", block: "h1" },
                            { title: "h2", block: "h2" },
                            { title: "h3", block: "h3" },
                            { title: "h4", block: "h4" },
                            { title: "h5", block: "h5" },
                            { title: "h6", block: "h6" },
                        ],
                    },

                    {
                        title: "Text",
                        items: [
                            { title: "Paragraph", block: "p" },
                            {
                                title: "Paragraph with small letters",
                                block: "small",
                            },
                        ],
                    },
                ],
            },
        },
    },
},

});


