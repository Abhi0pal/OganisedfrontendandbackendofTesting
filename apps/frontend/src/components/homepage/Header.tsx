"use client";

import { useState, useEffect, useRef } from "react";
import "./header.css";
import Image from "next/image";
import SearchBar from "../SearchBar";
import AccessibilityBar from "../AccessibilityBar";

type HeaderProps = {
  tenantTheme?: string;
};

const NMC_LOGIN_HREF = "https://dev-upyog.nmc.gov.in/upyog-ui/citizen/login";

export default function Header({ tenantTheme = "default" }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const normalizedTheme = String(tenantTheme || "default").toLowerCase();
  const loginHref = normalizedTheme === "nmc"
    ? NMC_LOGIN_HREF
    : normalizedTheme === "default"
      ? "/login"
      : `/login?tenant=${normalizedTheme}`;

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <AccessibilityBar 
        onLanguageChange={(lang) => console.log('Language:', lang)}
        onFontSizeChange={(size) => console.log('Font size:', size)}
        onContrastToggle={() => console.log('Contrast toggled')}
      />
      <div className="topbar">
        <div className="top-left">
          <div className="logo">
            <span className="tenant-header-logo" aria-hidden="true" />
            <img src="/img/logo-nmc.png" alt="Registration" className="w-auto h-auto" />
          </div>
        </div>

        <div className="top-center">
          <SearchBar 
            onSearch={(query) => console.log('Search:', query)}
          />
        </div>

        <div className="top-right">
          <div className="login-dropdown" ref={dropdownRef}>
            <button className="login-btn" type="button"
              id="loginDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false" onClick={toggleDropdown}>
                Login                
                <svg className="ms-2" width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.849976 0.850098L6.84998 6.8501L12.85 0.850098" stroke="#7A1E1C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

            <div className={`dropdown-menu ${isDropdownOpen ? "show" : ""}`}>
              <a href={loginHref} className="dropdown-item" onClick={closeDropdown}>Applicant</a>
              <a href={loginHref} className="dropdown-item" onClick={closeDropdown}>Department</a>
            </div>
          </div>
          <button 
              className="register-btn d-inline-block"
              type="button">
              Register
            </button>
        </div>
      </div>
    </header>
  );
}
