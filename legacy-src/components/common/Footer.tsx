import React from "react";
import { ShieldCheck } from "lucide-react";
import {
  SITE_NAME,
  FOOTER_TAGLINE,
  FOOTER_NOTE,
  FOOTER_LINKS,
} from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950" aria-label="Footer">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-indigo" />
              <span className="text-lg font-bold text-white">{SITE_NAME}</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">{FOOTER_TAGLINE}</p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/40 hover:text-white/80 transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} PlaceGuard AI. All rights reserved.
          </p>
          <p className="text-xs text-indigo/60 font-mono">{FOOTER_NOTE}</p>
        </div>
      </div>
    </footer>
  );
}
