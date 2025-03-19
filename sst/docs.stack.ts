// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

export function DocsStack() {
  // Create a static site for API documentation
  const site = new sst.aws.StaticSite('NFeFacilDocs', {
    path: 'docs/nfe-facil',
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
    domain: process.env.NFE_FACIL_DOCS_DOMAIN,
  });

  return {
    site,
    url: site.url,
  };
}
