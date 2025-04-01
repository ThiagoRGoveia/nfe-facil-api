// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

export function AppStack() {
  // Create a static site for API documentation
  const site = new sst.aws.StaticSite('NFeFacilApp', {
    path: 'builds/fe-app/dist',
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
  });

  return site
}
