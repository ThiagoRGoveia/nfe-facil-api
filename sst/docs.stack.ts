// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

export function DocsStack() {
  // Create a static site for API documentation
  const site = new sst.aws.StaticSite('ApiDocs', {
    // Path to the directory where api-docs are generated
    path: 'src/public/api-docs',
    // Configure how the site is built
    build: {
      // Command to generate the API documentation
      command: 'npm run nfse-doc:generate',
      // Where the build output is located (relative to path)
      output: '.',
    },
    // Configure asset handling
    assets: {
      // Configure caching for different file types
      fileOptions: [
        {
          files: ['**/*.css', '**/*.js'],
          cacheControl: 'max-age=31536000,public,immutable',
        },
        {
          files: '**/*.html',
          cacheControl: 'max-age=0,no-cache,no-store,must-revalidate',
        },
      ],
    },
    // Configure cache invalidation
    invalidation: {
      paths: 'all',
      wait: false,
    },
    // Optional: Configure custom domain if available
    domain: process.env.DOCS_DOMAIN,
  });

  return {
    site,
    url: site.url,
  };
}
