export default function FloatingSocial() {
  const whatsappNumber = "905435755300";
  const phoneNumber = "+905435755300";
  const instagramUrl = "https://www.instagram.com/agorarockdrill/";

  return (
    <>
      {/* Desktop: Vertical floating on right side */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 flex-col z-40">
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          className="bg-[#25D366] text-white w-16 h-16 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-whatsapp"
        >
          <i className="fab fa-whatsapp text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white w-16 h-16 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-instagram"
        >
          <i className="fab fa-instagram text-2xl" aria-hidden="true"></i>
        </a>
        <a
          href={`tel:${phoneNumber}`}
          aria-label="Call us"
          className="bg-[#1E88E5] text-white w-16 h-16 flex items-center justify-center hover:w-20 transition-all duration-300 shadow-lg"
          data-testid="floating-phone"
        >
          <i className="fas fa-phone text-2xl" aria-hidden="true"></i>
        </a>
      </div>

      {/* Mobile: Horizontal at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex">
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          className="bg-[#25D366] text-white flex-1 h-16 flex items-center justify-center shadow-lg"
          data-testid="floating-whatsapp-mobile"
        >
          <i className="fab fa-whatsapp text-3xl" aria-hidden="true"></i>
        </a>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex-1 h-16 flex items-center justify-center shadow-lg"
          data-testid="floating-instagram-mobile"
        >
          <i className="fab fa-instagram text-3xl" aria-hidden="true"></i>
        </a>
        <a
          href={`tel:${phoneNumber}`}
          aria-label="Call us"
          className="bg-[#1E88E5] text-white flex-1 h-16 flex items-center justify-center shadow-lg"
          data-testid="floating-phone-mobile"
        >
          <i className="fas fa-phone text-3xl" aria-hidden="true"></i>
        </a>
      </div>
    </>
  );
}
