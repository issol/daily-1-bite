/**
 * Apple Universal Links AASA endpoint.
 *
 * Apple's validator silently rejects responses with the wrong
 * Content-Type. AWS Amplify serves files in `public/` via CloudFront
 * with default MIME detection — `apple-app-site-association` has no
 * extension, so it ends up as `application/octet-stream` instead of
 * `application/json`. Hence this route handler.
 *
 * `next.config.ts` rewrites `/.well-known/apple-app-site-association`
 * to `/api/aasa` so the public-facing URL stays canonical.
 *
 * App ID format is <TeamID>.<BundleID>. dayseed lives at
 * `MARV67DMQN.app.dayseed.mobile`. Components match `/i/*` for the
 * v1.3 group invite links.
 */

const AASA = {
  applinks: {
    details: [
      {
        appIDs: ['MARV67DMQN.app.dayseed.mobile'],
        components: [
          {
            '/': '/i/*',
            comment: 'v1.3 group invite links',
          },
        ],
      },
    ],
  },
};

export async function GET() {
  return new Response(JSON.stringify(AASA), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Apple may re-fetch infrequently; a short cache is safer than
      // a long one while we're iterating on the file.
      'Cache-Control': 'public, max-age=300',
    },
  });
}
