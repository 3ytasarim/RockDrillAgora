import { useState, useEffect } from "react";

export default function FloatingSocial() {
  const [isVisible, setIsVisible] = useState(false);
  const whatsappNumber = "905521718672";
  const phoneNumber = "+905521718672";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop: Vertical floating on right side */}
      <div className={`hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 flex-col z-40 transition-transform duration-500 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          className="bg-[#25D366] text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-whatsapp"
        >
          <i className="fab fa-whatsapp text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://www.instagram.com/agorarockdrill/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-instagram"
        >
          <i className="fab fa-instagram text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://www.facebook.com/agorarockdrill"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Facebook"
          className="bg-[#1877F2] text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-facebook"
        >
          <i className="fab fa-facebook text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://www.linkedin.com/company/agorarockdrill/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on LinkedIn"
          className="bg-[#0A66C2] text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-linkedin"
        >
          <i className="fab fa-linkedin text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://x.com/agorarockdrill"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on X (Twitter)"
          className="bg-black text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-twitter"
        >
          <i className="fab fa-x-twitter text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://www.youtube.com/@agorarockdrill"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Subscribe to our YouTube"
          className="bg-[#FF0000] text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-youtube"
        >
          <i className="fab fa-youtube text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href={`tel:${phoneNumber}`}
          aria-label="Call us"
          className="bg-[#1E88E5] text-white w-14 h-14 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-phone"
        >
          <i className="fas fa-phone text-2xl" aria-hidden="true"></i>
        </a>
      </div>

      {/* Mobile: Horizontal at bottom */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex transition-transform duration-500 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          className="bg-[#25D366] text-white flex-1 h-14 flex items-center justify-center shadow-lg"
          data-testid="floating-whatsapp-mobile"
        >
          <i className="fab fa-whatsapp text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://www.instagram.com/agorarockdrill/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex-1 h-14 flex items-center justify-center shadow-lg"
          data-testid="floating-instagram-mobile"
        >
          <i className="fab fa-instagram text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href="https://www.facebook.com/agorarockdrill"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Facebook"
          className="bg-[#1877F2] text-white flex-1 h-14 flex items-center justify-center shadow-lg"
          data-testid="floating-facebook-mobile"
        >
          <i className="fab fa-facebook text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href={`tel:${phoneNumber}`}
          aria-label="Call us"
          className="bg-[#1E88E5] text-white flex-1 h-14 flex items-center justify-center shadow-lg"
          data-testid="floating-phone-mobile"
        >
          <i className="fas fa-phone text-2xl" aria-hidden="true"></i>
        </a>
      </div>
    </>
  );
}
