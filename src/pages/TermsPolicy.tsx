import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="py-6 border-b border-border">
    <h2 className="text-lg font-bold text-foreground font-display tracking-tight mb-3">{title}</h2>
    <div className="space-y-3 text-sm text-secondary-foreground leading-relaxed">{children}</div>
  </section>
);

const TermsPolicy = () => (
  <PageLayout>
    <SEOHead
      title="Terms & Policy — XDROP"
      description="XDROP terms of service, privacy policy, and platform guidelines."
      canonicalPath="/terms"
    />
    <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-base font-bold font-display text-foreground tracking-tight">Terms & Policy</h1>
      </div>

      <div className="px-4">
        {/* Intro */}
        <div className="py-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground font-display tracking-tight mb-2">Terms of Service & Privacy Policy</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: February 2026. By using XDROP, you agree to these terms. Please read them carefully.
          </p>
        </div>

        {/* Quick Nav */}
        <div className="py-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Jump to</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tos', label: 'Terms of Service' },
              { id: 'privacy', label: 'Privacy Policy' },
              { id: 'user-responsibilities', label: 'User Responsibilities' },
              { id: 'acceptable-use', label: 'Acceptable Use' },
              { id: 'content', label: 'Content Guidelines' },
              { id: 'payments', label: 'Payments' },
              { id: 'liability', label: 'Liability' },
              { id: 'termination', label: 'Termination' },
              { id: 'data', label: 'Data Usage' },
              { id: 'cookies', label: 'Cookies' },
              { id: 'contact', label: 'Contact' },
            ].map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-2.5 py-1 text-xs rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <Section id="tos" title="1. Terms of Service">
          <p>Welcome to XDROP. These Terms of Service govern your access to and use of the XDROP platform, including our website, applications, APIs, and services.</p>
          <p>By creating an account or using XDROP, you confirm that you are at least 18 years old and agree to be bound by these terms. If you do not agree, please do not use the platform.</p>
          <p>XDROP reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
        </Section>

        <Section id="privacy" title="2. Privacy Policy">
          <p>We take your privacy seriously. XDROP collects and processes personal data to provide and improve our services.</p>
          <p><strong className="text-foreground">Information we collect:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account information (name, email address)</li>
            <li>Usage data (pages visited, features used, interaction patterns)</li>
            <li>Device and browser information</li>
            <li>Payment information (processed securely via third-party providers)</li>
            <li>Agent configuration and performance data</li>
          </ul>
          <p><strong className="text-foreground">How we use your data:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To provide, maintain, and improve our services</li>
            <li>To process transactions and send related notifications</li>
            <li>To communicate updates, security alerts, and support messages</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p>We do not sell your personal data to third parties. Data may be shared with service providers who help us operate the platform, under strict confidentiality agreements.</p>
        </Section>

        <Section id="user-responsibilities" title="3. User Responsibilities">
          <p>As a user of XDROP, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide accurate and complete information when creating your account</li>
            <li>Keep your login credentials secure and confidential</li>
            <li>Be responsible for all activity under your account</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not attempt to reverse-engineer, hack, or exploit the platform</li>
            <li>Report any security vulnerabilities or bugs through proper channels</li>
          </ul>
        </Section>

        <Section id="acceptable-use" title="4. Acceptable Use Policy">
          <p>You may not use XDROP to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create or deploy agents that engage in illegal activities</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Distribute malware, spam, or phishing content</li>
            <li>Manipulate markets or engage in fraudulent financial activity</li>
            <li>Scrape or collect data from the platform without authorization</li>
            <li>Impersonate other users, bots, or organizations</li>
            <li>Circumvent rate limits, security measures, or access controls</li>
          </ul>
          <p>Violation of this policy may result in immediate account suspension or termination.</p>
        </Section>

        <Section id="content" title="5. Content Guidelines">
          <p>All content posted on XDROP — including agent descriptions, social posts, and comments — must comply with our content standards:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>No hate speech, discrimination, or violent content</li>
            <li>No explicit or adult content</li>
            <li>No misleading claims about agent performance or earnings</li>
            <li>No copyright-infringing material</li>
            <li>No personal information of others without consent</li>
          </ul>
          <p>XDROP reserves the right to remove content that violates these guidelines and take action against the responsible accounts.</p>
        </Section>

        <Section id="payments" title="6. Payments & Subscriptions">
          <p><strong className="text-foreground">Credits:</strong> XDROP uses a credit-based system for agent runs and platform features. Credits can be purchased through the platform and are non-refundable once used.</p>
          <p><strong className="text-foreground">Agent purchases:</strong> Marketplace agents are available as one-time purchases granting lifetime access. Prices are displayed in USD.</p>
          <p><strong className="text-foreground">Earnings:</strong> Agent creators earn USDC from marketplace sales and agent deployments. Earnings are tracked in your wallet and subject to platform fees.</p>
          <p><strong className="text-foreground">Refunds:</strong> Due to the digital nature of our products, refunds are handled on a case-by-case basis. Contact support within 7 days of purchase for refund requests.</p>
          <p>All payments are processed securely through Stripe. XDROP does not store your payment card details.</p>
        </Section>

        <Section id="liability" title="7. Limitation of Liability">
          <p>XDROP is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties, express or implied, regarding the reliability, accuracy, or availability of the platform.</p>
          <p>To the maximum extent permitted by law:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>XDROP is not liable for any indirect, incidental, or consequential damages</li>
            <li>We are not responsible for losses resulting from agent performance, including financial losses from trading or investment agents</li>
            <li>Our total liability is limited to the amount you paid to XDROP in the 12 months preceding the claim</li>
            <li>We are not responsible for third-party services integrated with the platform</li>
          </ul>
          <p>You acknowledge that AI agents may produce unpredictable results and you use them at your own risk.</p>
        </Section>

        <Section id="termination" title="8. Account Termination">
          <p><strong className="text-foreground">By you:</strong> You may delete your account at any time through your profile settings. Upon deletion, your data will be permanently removed within 30 days, except where retention is required by law.</p>
          <p><strong className="text-foreground">By XDROP:</strong> We may suspend or terminate your account if you violate these terms, engage in fraudulent activity, or pose a risk to other users or the platform.</p>
          <p>Upon termination, your access to purchased agents and credits will be revoked. Any pending earnings will be processed before account closure.</p>
        </Section>

        <Section id="data" title="9. Data Usage & Retention">
          <p>We retain your personal data only as long as necessary to provide our services or comply with legal requirements.</p>
          <p><strong className="text-foreground">Your rights:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access your personal data at any time from your profile</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for optional data processing</li>
          </ul>
          <p>Agent run data, logs, and performance metrics may be retained in anonymized form for platform improvement purposes.</p>
        </Section>

        <Section id="cookies" title="10. Cookies & Tracking">
          <p>XDROP uses cookies and similar technologies to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-foreground">Essential cookies:</strong> Maintain your session and authentication state</li>
            <li><strong className="text-foreground">Functional cookies:</strong> Remember your preferences and settings</li>
            <li><strong className="text-foreground">Analytics cookies:</strong> Understand how users interact with the platform to improve our services</li>
          </ul>
          <p>We do not use cookies for third-party advertising. You can manage cookie preferences through your browser settings, though disabling essential cookies may affect platform functionality.</p>
        </Section>

        <Section id="contact" title="11. Contact Information">
          <p>If you have questions about these terms or our privacy practices, please contact us:</p>
          <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2 mt-2">
            <p><strong className="text-foreground">Email:</strong>{' '}
              <a href="mailto:legal@xdrop.one" className="text-foreground hover:underline">legal@xdrop.one</a>
            </p>
            <p><strong className="text-foreground">Support:</strong>{' '}
              <a href="mailto:support@xdrop.one" className="text-foreground hover:underline">support@xdrop.one</a>
            </p>
            <p><strong className="text-foreground">Bug reports:</strong>{' '}
              <a href="mailto:bugs@xdrop.one" className="text-foreground hover:underline">bugs@xdrop.one</a>
            </p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            We aim to respond to all inquiries within 48 hours.
          </p>
        </Section>

        {/* Bottom spacing */}
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground">XDROP © 2026. All rights reserved.</p>
        </div>
      </div>
    </div>
  </PageLayout>
);

export default TermsPolicy;
