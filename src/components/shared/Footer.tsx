import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-bold text-primary tracking-tight">
              PayPulse
            </Link>
            <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
              A modern digital payment platform designed for fast, secure, and hassle-free global transactions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Digital Wallet</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Money Transfer</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Payment Gateway</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Merchant Solutions</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} PayPulse Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span>🔒 PCI-DSS Compliant</span>
            <span>⚡ 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}