import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing and using the Agora Rock Drill website (agorarockdrill.shop), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website.

These Terms and Conditions apply to all visitors, users, and others who access or use our website and services.`,
  },
  {
    title: "2. About Our Services",
    content: `Agora Rock Drill A.Ş. provides an online catalog of spare parts for hydraulic rock drills and drill rig equipment. Our website allows you to:

- Browse our product catalog
- Search for specific parts by name, brand, or product code
- Submit quote requests for products of interest
- Contact our team for technical support

All transactions, pricing, and delivery terms are finalized through direct communication with our sales team. Prices displayed on the website (if any) are indicative only and subject to change without notice.`,
  },
  {
    title: "3. Product Information",
    content: `We make every effort to ensure that product descriptions, specifications, and images are accurate. However:

- Product images are for illustrative purposes only and may differ slightly from the actual product
- We reserve the right to correct errors, inaccuracies, or omissions at any time without prior notice
- Compatibility information is provided in good faith but should be verified before ordering
- We are not responsible for errors resulting from the customer specifying incorrect part numbers or specifications

When in doubt, please contact our technical team for verification before placing an order.`,
  },
  {
    title: "4. Quote Requests",
    content: `Submitting a quote request through our website does not constitute a binding order or contract. A quote request is an expression of interest only.

A binding agreement is formed only when:
- You receive a formal written quotation from Agora Rock Drill A.Ş.
- You confirm acceptance of that quotation in writing
- We confirm receipt of payment or issue a formal invoice

We reserve the right to refuse or modify any quote request at our discretion.`,
  },
  {
    title: "5. Intellectual Property",
    content: `All content on this website — including text, images, product descriptions, logos, and design — is the property of Agora Rock Drill A.Ş. or its content suppliers and is protected by applicable intellectual property laws.

You may not reproduce, distribute, or create derivative works from any content on this website without our express written permission.

Brand names mentioned on this website (Atlas Copco, Epiroc, Sandvik, Furukawa, etc.) are trademarks of their respective owners. Their use on this website is for identification purposes only and does not imply any affiliation with or endorsement by those companies.`,
  },
  {
    title: "6. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, Agora Rock Drill A.Ş. shall not be liable for:

- Any indirect, incidental, special, or consequential damages
- Loss of profits, revenue, data, or business opportunities
- Equipment downtime or operational losses resulting from part failures
- Damages resulting from the use or inability to use our website

Our total liability for any claim arising from the use of our website shall not exceed the value of the specific transaction giving rise to the claim.`,
  },
  {
    title: "7. Warranty",
    content: `Spare parts supplied by Agora Rock Drill A.Ş. carry a limited warranty against manufacturing defects. Warranty terms, duration, and coverage are specified separately in our sales documentation and vary by product category.

The warranty does not cover:
- Normal wear and tear
- Damage resulting from improper installation or use
- Damage resulting from use in applications for which the part was not designed
- Parts modified or repaired by third parties

Our website is provided "as is" without any warranty of any kind regarding its availability, accuracy, or fitness for a particular purpose.`,
  },
  {
    title: "8. Third-Party Links",
    content: `Our website may contain links to third-party websites for your convenience. These links do not imply endorsement of or affiliation with those sites. We are not responsible for the content, privacy practices, or terms of any third-party website.`,
  },
  {
    title: "9. Governing Law",
    content: `These Terms and Conditions are governed by and construed in accordance with the laws of the Republic of Turkey. Any dispute arising from or relating to these terms or your use of our website shall be subject to the exclusive jurisdiction of the courts of Ankara, Turkey.`,
  },
  {
    title: "10. Changes to These Terms",
    content: `We reserve the right to update or modify these Terms and Conditions at any time without prior notice. Changes take effect immediately upon posting to this page. Your continued use of our website after changes are posted constitutes your acceptance of the revised terms.`,
  },
  {
    title: "11. Contact",
    content: `For questions regarding these Terms and Conditions, please contact:

AGORA Rock Drill A.Ş.
Ankara, Turkey
Email: info@agorarockdrill.com
Phone: +90 312 385 60 03`,
  },
];

export default function Terms() {
  return (
    <div>
      <Helmet>
        <title>Terms & Conditions | Agora Rock Drill</title>
        <meta
          name="description"
          content="Terms and Conditions for using the Agora Rock Drill website and services. Read our policies on product information, quote requests, warranty, and liability."
        />
        <link rel="canonical" href="https://agorarockdrill.shop/terms" />
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
            Terms &amp; Conditions
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
          >
            <p className="text-muted-foreground text-lg leading-relaxed mb-10 p-6 bg-muted rounded-xl border border-border">
              These Terms and Conditions govern your use of the Agora Rock Drill website and
              services. Please read them carefully before using our website. By using
              agorarockdrill.shop you agree to these terms.
            </p>

            <div className="space-y-10">
              {sections.map((section, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-10 last:border-0"
                  data-testid={`terms-section-${i}`}
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">{section.title}</h2>
                  <div className="text-muted-foreground leading-relaxed">
                    {section.content.split("\n").map((line, j) => {
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
