import { motion } from "framer-motion";
import { Shield, Award, Globe, Users, Wrench, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet";

const stats = [
  { value: "20+", label: "Years of Experience" },
  { value: "700+", label: "m² Warehouse Space" },
  { value: "15,000+", label: "Products in Catalog" },
  { value: "55+", label: "Countries Served" },
];

const values = [
  {
    icon: Shield,
    title: "Quality Guarantee",
    description:
      "Every part we supply meets strict OEM-equivalent standards. We source only from trusted manufacturers to ensure your equipment performs reliably in demanding conditions.",
  },
  {
    icon: Award,
    title: "20 Years of Expertise",
    description:
      "Since our founding, we have built deep technical knowledge in hydraulic rock drill components and drill rig spare parts — knowledge that we put to work for every customer.",
  },
  {
    icon: Globe,
    title: "Worldwide Shipping",
    description:
      "We ship to more than 50 countries. Our logistics team ensures fast, secure delivery with full documentation for customs clearance wherever you operate.",
  },
  {
    icon: Users,
    title: "Expert Support",
    description:
      "Our engineers understand the equipment, not just the parts. We help you identify the correct component, reducing downtime and costly mismatches.",
  },
  {
    icon: Wrench,
    title: "Extensive Inventory",
    description:
      "With over 2,000 parts in stock across multiple brands — Atlas Copco, Epiroc, Sandvik, and Furukawa — we fill orders fast without long lead times.",
  },
  {
    icon: TrendingUp,
    title: "Competitive Pricing",
    description:
      "As a direct distributor working with multiple manufacturers, we offer highly competitive pricing on high-quality spare parts without sacrificing reliability.",
  },
];

export default function About() {
  return (
    <div>
      <Helmet>
        <title>About Us | Agora Rock Drill - Rock Drilling Spare Parts Specialists</title>
        <meta
          name="description"
          content="Agora Rock Drill A.Ş. — Over 20 years of experience supplying high-quality spare parts for hydraulic rock drills and drill rigs. Atlas Copco, Epiroc, Sandvik, Furukawa compatible parts. Based in Ankara, Turkey."
        />
        <link rel="canonical" href="https://agorarockdrill.shop/about" />
        <meta property="og:title" content="About Agora Rock Drill - Spare Parts Specialists" />
        <meta
          property="og:description"
          content="20+ years of expertise in rock drill spare parts. 700+ m² warehouse in Ankara, Turkey. Worldwide shipping."
        />
        <meta property="og:url" content="https://agorarockdrill.shop/about" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="industrial-gradient text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold mb-4"
          >
            About Agora Rock Drill
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-primary-foreground/90 max-w-3xl mx-auto"
          >
            Your trusted partner for hydraulic rock drill and drill rig spare parts — delivering
            quality, reliability, and expert support for over two decades.
          </motion.p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Two Decades of Rock Drilling Excellence
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-5">
                AGORA Rock Drill A.Ş. was established with a single mission: to provide mining
                and construction companies worldwide with reliable, high-quality spare parts for
                their hydraulic rock drills and drill rigs — at competitive prices, with fast
                delivery.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-5">
                Over the past 20+ years, we have grown from a small regional supplier to an
                internationally recognized distributor serving clients in over 50 countries.
                Our 700+ m² warehouse in Ankara, Turkey, is stocked with more than 2,000
                genuine and OEM-equivalent components, ensuring we can fulfill orders quickly
                and accurately.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We specialize in parts compatible with leading brands including Atlas Copco,
                Epiroc, Sandvik, and Furukawa — covering everything from piston and cylinder
                components to seal kits, rotation units, shank adapters, and complete
                hydraulic assemblies.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-6"
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-8 text-center shadow-lg"
                  data-testid={`stat-card-${i}`}
                >
                  <div className="text-5xl font-extrabold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose Agora Rock Drill</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We are more than a parts supplier. We are a technical partner committed to keeping
              your equipment running at peak performance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                data-testid={`value-card-${i}`}
              >
                <value.icon className="text-primary mb-4" size={36} />
                <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AGORA Rock Drill */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why AGORA Rock Drill?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              AGORA Rock Drill A.Ş. is a Leading Trademark in Rock Drilling Industry
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🔧",
                title: "Strong Sectoral Knowledge",
                description: "We produce solutions for spare parts, maintenance and repair needs of rock drilling machines. With 20+ years of expertise, our team understands your equipment at the deepest level."
              },
              {
                emoji: "🚚",
                title: "Fast and Reliable Delivery",
                description: "As AGORA Rock Drill, we provide high speed delivery to dozens of countries in cooperation with leading logistics companies including DHL, FedEx and UPS."
              },
              {
                emoji: "🏭",
                title: "Wide Inventory Advantage",
                description: "We stock thousands of original and alternative spare parts in our 700+ m² warehouses, ensuring fast order fulfillment without long lead times."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                data-testid={`brand-card-${i}`}
              >
                <div className="text-4xl mb-4">{item.emoji}</div>
                <div className="text-xl font-bold text-primary mb-3">{item.title}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Find Your Parts?</h2>
            <p className="text-xl text-white/90 mb-4 leading-relaxed">
              Browse our catalog of 15,000+ spare parts or contact our expert team for
              personalized assistance. We respond quickly to all inquiries and ship worldwide.
            </p>
            <p className="text-white/80 mb-10">
              AGORA Rock Drill A.Ş. — Ankara, Turkey | agora@agorarockdrill.com | +90 552 171 86 72
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/spare-parts"
                className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors text-lg"
                data-testid="button-browse-parts"
              >
                Browse Spare Parts
              </a>
              <a
                href="/contact"
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg border border-white/40"
                data-testid="button-contact-us"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
