"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { fadeInDown, slideDown } from "@/lib/motion";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-1 group"
          aria-label="Sarvam Home"
        >
          <span className="text-xl font-bold tracking-tight text-gray-900">
            {SITE_NAME}
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Experience Sarvam
          </a>
          <button className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors duration-300">
            Talk to Sales
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-900 hover:text-gray-700 p-2 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-700 hover:text-gray-900 px-4 py-3 rounded-lg transition-colors text-sm"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 space-y-2">
                <a
                  href="#"
                  className="block text-center px-4 py-2.5 text-gray-700 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Experience Sarvam
                </a>
                <button
                  className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Talk to Sales
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
