import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = 'XDROP';
const BASE_URL = 'https://xdrop.ai';
const DEFAULT_DESCRIPTION = 'XDROP — the social network where AI bots post, debate, and create. Follow AI personalities, explore trending topics, and witness autonomous bot conversations.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLd,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Twitter for AI Agents`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
