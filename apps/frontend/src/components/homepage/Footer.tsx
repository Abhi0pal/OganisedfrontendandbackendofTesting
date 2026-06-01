"use client";

import "./footer.css";

type FooterProps = {
  tenantTheme?: string;
};

export default function Footer({ tenantTheme = "default" }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="contact">
          <img src="/img/logo-footer.png" alt="NMC" className="w-auto h-auto" />
        </div>

        <div className="contact-us">
          <h2>Contact Us</h2>
          <p className="d-flex align-items-start mb-3">            
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
              <path d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 20 7 20C7 20 14 12.25 14 7C14 3.13 10.87 0 7 0ZM7 9.5C5.62 9.5 4.5 8.38 4.5 7C4.5 5.62 5.62 4.5 7 4.5C8.38 4.5 9.5 5.62 9.5 7C9.5 8.38 8.38 9.5 7 9.5Z" fill="#212121"/>
            </svg>
            Nashik Municipal Corporation, Rajiv Gandhi Bhavan, Sharanpur Road, Nashik
          </p>
          <p>            
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
              <path d="M17.01 12.38C15.78 12.38 14.59 12.18 13.48 11.82C13.13 11.7 12.74 11.79 12.47 12.06L10.9 14.03C8.07 12.68 5.42 10.13 4.01 7.2L5.96 5.54C6.23 5.26 6.31 4.87 6.2 4.52C5.83 3.41 5.64 2.22 5.64 0.99C5.64 0.45 5.19 0 4.65 0H1.19C0.65 0 0 0.24 0 0.99C0 10.28 7.73 18 17.01 18C17.72 18 18 17.37 18 16.82V13.37C18 12.83 17.55 12.38 17.01 12.38Z" fill="#212121"/>
            </svg>
            0253 - 2575631 / 2 / 3 / 4
          </p>
        </div>

        <div className="social-links">
          <h2>Follow Us</h2>
          <a href="#" rel="noopener noreferrer" className="me-2">
            <img src="/img/socialmedia/facebook.png" alt="Facebook" className="w-auto h-auto" />
          </a>
          <a href="#" rel="noopener noreferrer" className="me-2">
            <img src="/img/socialmedia/twitter.png" alt="Twitter" className="w-auto h-auto" />
          </a>
          <a href="#" rel="noopener noreferrer" className="me-2">
            <img src="/img/socialmedia/youtube.png" alt="YouTube" className="w-auto h-auto" />
          </a>
          <a href="#" rel="noopener noreferrer">
            <img src="/img/socialmedia/instagram.png" alt="Instagram" className="w-auto h-auto" />
          </a>
        </div>
      </div>

      <div className="footer-bottom d-flex justify-content-between align-items-center">
        <p>© 2026 Copyright | Nashik Municipal Corporation | Government of Maharashtra | All Rights Reserved</p>
        <p><a href="#" rel="noopener noreferrer">Terms of Service</a> | <a href="#" rel="noopener noreferrer">Privacy Policy</a></p>
      </div>
    </footer>
  );
}
