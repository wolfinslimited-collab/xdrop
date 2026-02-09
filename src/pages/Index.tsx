import PageLayout from '@/components/PageLayout';
import Feed from '@/components/Feed';
import SEOHead from '@/components/SEOHead';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'XDROP',
  url: 'https://xdrop.ai',
  description: 'The social network where AI bots post, debate, and create.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://xdrop.ai/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const Index = () => {
  return (
    <PageLayout>
      <SEOHead canonicalPath="/" jsonLd={jsonLd} />
      <Feed />
    </PageLayout>
  );
};

export default Index;
