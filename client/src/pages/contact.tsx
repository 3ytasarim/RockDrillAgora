import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: "", email: "", phone: "", company: "", message: "" });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+90 312 385 60 03", "WhatsApp: +90 543 575 53 00"],
      color: "text-primary"
    },
    {
      icon: Mail,
      title: "Email",
      details: ["agora@agorarockdrill.com"],
      color: "text-accent"
    },
    {
      icon: MapPin,
      title: "Location",
      details: ["Ankara, Turkey", "700+ m² Warehouse"],
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Mon - Fri: 9:00 AM - 6:00 PM", "Sat: 9:00 AM - 2:00 PM"],
      color: "text-accent"
    }
  ];

  return (
    <div>
      {/* Header */}
      <section className="industrial-gradient text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold mb-4"
          >
            Get In Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-primary-foreground/90 max-w-2xl mx-auto"
          >
            Have questions about our products? Our expert team is here to help you find the perfect spare parts for your equipment.
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border"
                data-testid={`contact-info-${index}`}
              >
                <info.icon className={`${info.color} mb-4`} size={32} />
                <h3 className="font-bold text-lg mb-3 text-foreground">{info.title}</h3>
                {info.details.map((detail, i) => (
                  <p key={i} className="text-muted-foreground text-sm mb-1">
                    {detail}
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-foreground">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Your name"
                    data-testid="input-name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+90 5XX XXX XX XX"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Company
                  </label>
                  <Input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company name"
                    data-testid="input-company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    placeholder="Tell us about your requirements..."
                    data-testid="input-message"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg"
                  data-testid="button-submit"
                >
                  <Send size={20} className="mr-2" />
                  Send Message
                </Button>
              </form>
            </motion.div>

            {/* Company Info & Social */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
                <h2 className="text-3xl font-bold mb-6 text-foreground">AGORA Rock Drill A.Ş.</h2>
                
                <div className="space-y-4 mb-8">
                  <p className="text-muted-foreground leading-relaxed">
                    With over 20 years of experience in the industry, we specialize in providing high-quality spare parts for hydraulic rock drills and drill rigs.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our 700+ m² warehouse in Ankara, Turkey, stocks a comprehensive range of components compatible with leading brands including Atlas Copco, Epiroc, Furukawa, and more.
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-bold text-lg mb-4 text-foreground">Follow Us</h3>
                  <div className="flex gap-4">
                    <a 
                      href="https://www.facebook.com/agorarockdrill" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-all hover:scale-110"
                      data-testid="social-facebook"
                    >
                      <i className="fab fa-facebook text-xl"></i>
                    </a>
                    <a 
                      href="https://www.linkedin.com/company/agorarockdrill" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-all hover:scale-110"
                      data-testid="social-linkedin"
                    >
                      <i className="fab fa-linkedin text-xl"></i>
                    </a>
                    <a 
                      href="https://wa.me/905435755300" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:bg-[#25D366]/90 transition-all hover:scale-110"
                      data-testid="social-whatsapp"
                    >
                      <i className="fab fa-whatsapp text-xl"></i>
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="bg-gradient-to-br from-primary to-accent p-8 rounded-lg shadow-lg text-white">
                <h3 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h3>
                <p className="mb-6">Call us directly or send a WhatsApp message</p>
                <div className="space-y-3">
                  <a 
                    href="tel:+903123856003" 
                    className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-all"
                    data-testid="quick-phone"
                  >
                    <Phone size={20} />
                    <span className="font-semibold">+90 312 385 60 03</span>
                  </a>
                  <a 
                    href="https://wa.me/905435755300" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-all"
                    data-testid="quick-whatsapp"
                  >
                    <i className="fab fa-whatsapp text-xl"></i>
                    <span className="font-semibold">WhatsApp: +90 543 575 53 00</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
