import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

const sections = [
  {
    title: "1. Information We Collect",
    content: `When you use the Agora Rock Drill website (agorarockdrill.shop), we may collect the following information:

**Contact Form & Quote Requests:** When you submit a quote request or contact form, we collect your name, company name, email address, phone number, and the content of your message. This information is used solely to respond to your inquiry.

**Usage Data:** We use Google Analytics to collect anonymized data about how visitors use our website, including pages visited, time spent, and general geographic region. This data cannot be used to identify you personally.

**Cookies:** Our website uses cookies strictly necessary for the site to function, and analytics cookies from Google Analytics. You can disable cookies in your browser settings at any time.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information you provide to:

- Respond to your product inquiries and quote requests
- Provide technical support and product recommendations
- Send order-related communications if you become a customer
- Improve our website and product catalog based on anonymized usage data

We do not use your personal data for automated decision-making or profiling.`,
  },
  {
    title: "3. Data Sharing",
    content: `We do not sell, rent, or trade your personal information to any third parties.

We may share your information with:

**Email Service Providers:** We use SMTP services to send and receive emails. Your contact details are transmitted through these services when we respond to your inquiries.

**Google Analytics:** Anonymized, aggregated usage data is shared with Google Analytics. No personally identifiable information is included.

**Legal Requirements:** We may disclose information if required by law, court order, or governmental authority.`,
  },
  {
    title: "4. Data Retention",
    content: `We retain contact form submissions and quote request emails for up to 3 years to maintain a record of customer communications. Anonymized analytics data is retained according to Google Analytics' standard retention policies.

You may request deletion of your personal data at any time by contacting us at info@agorarockdrill.com.`,
  },
  {
    title: "5. Data Security",
    content: `We take reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Our website is served over HTTPS to ensure encrypted communication.

However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: "6. Your Rights",
    content: `Depending on your location, you may have the following rights regarding your personal data:

- **Right of Access:** Request a copy of the personal data we hold about you
- **Right to Rectification:** Request correction of inaccurate data
- **Right to Erasure:** Request deletion of your personal data
- **Right to Restriction:** Request that we limit how we use your data
- **Right to Object:** Object to our use of your personal data

To exercise any of these rights, please contact us at info@agorarockdrill.com or by post at our address below.`,
  },
  {
    title: "7. International Transfers",
    content: `Agora Rock Drill A.Ş. is based in Turkey. If you are located in the European Union or other jurisdictions with data protection laws, please note that your data may be transferred to and processed in Turkey, which may have different data protection standards.

By submitting a contact or quote form on our website, you consent to this transfer.`,
  },
  {
    title: "8. Third-Party Links",
    content: `Our website may contain links to third-party websites, including social media platforms (Instagram, LinkedIn, Facebook, YouTube, X/Twitter). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our website and services are intended for business-to-business (B2B) use only and are not directed at individuals under the age of 18. We do not knowingly collect personal data from minors.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. The updated version will be posted on this page with a revised "Last Updated" date. We encourage you to review this page periodically.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**AGORA Rock Drill A.Ş.**
Ankara, Turkey
Email: info@agorarockdrill.com
Phone: +90 312 385 60 03
WhatsApp: +90 543 575 53 00`,
  },
];

export default function Privacy() {
  return (
    <div>
      <Helmet>
        <title>Privacy Policy | Agora Rock Drill</title>
        <meta
          name="description"
          content="Privacy Policy for Agora Rock Drill A.Ş. — Learn how we collect, use, and protect your personal information when you use our website and services."
        />
        <link rel="canonical" href="https://agorarockdrill.shop/privacy" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Hero */}
      <section className="industrial-gradient text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-foreground/90"
          >
            Last Updated: March 2025
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="prose prose-slate max-w-none"
          >
            <p className="text-muted-foreground text-lg leading-relaxed mb-10 p-6 bg-muted rounded-xl border border-border">
              Agora Rock Drill A.Ş. ("we", "us", "our") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your personal
              information when you visit <strong>agorarockdrill.shop</strong> or contact us for
              product inquiries and quote requests.
            </p>

            <div className="space-y-10">
              {sections.map((section, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-10 last:border-0"
                  data-testid={`privacy-section-${i}`}
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">{section.title}</h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content.split("\n").map((line, j) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return (
                          <p key={j} className="font-semibold text-foreground mt-4 mb-1">
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      }
                      if (line.includes("**")) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <p key={j} className="mb-2">
                            {parts.map((part, k) =>
                              k % 2 === 1 ? <strong key={k} className="text-foreground">{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={j} className="ml-4 mb-1 list-disc">
                            {line.slice(2)}
                          </li>
                        );
                      }
                      return line ? (
                        <p key={j} className="mb-3">
                          {line}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
