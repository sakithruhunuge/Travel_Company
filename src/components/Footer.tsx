import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-slate-400 py-16 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight text-white">
                HORIZON<span className="text-brand-primary">TRAVEL</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Crafting premium travel experiences and lifelong memories. Explore the world&apos;s most breathtaking destinations with our dedicated team of travel experts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#home" className="text-sm hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-sm hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#packages" className="text-sm hover:text-white transition-colors">
                  Packages
                </a>
              </li>
              <li>
                <a href="#why-choose-us" className="text-sm hover:text-white transition-colors">
                  Why Choose Us
                </a>
              </li>
            </ul>
          </div>

          {/* Business Hours / Useful Info */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Business Hours
            </h3>
            <ul className="space-y-3 text-sm">
              <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
              <li>Saturday: 10:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="block text-white font-semibold">Address:</span>
                123 Travel Avenue, Suite 100, Ocean City
              </li>
              <li>
                <span className="block text-white font-semibold">Phone:</span>
                +1 (555) 123-4567
              </li>
              <li>
                <span className="block text-white font-semibold">Email:</span>
                hello@horizontravel.com
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {currentYear} Horizon Travel. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
