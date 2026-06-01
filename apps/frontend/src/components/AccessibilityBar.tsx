'use client';

import React, { useState } from 'react';
import styles from './AccessibilityBar.module.css';

interface AccessibilityBarProps {
  onLanguageChange?: (language: string) => void;
  onFontSizeChange?: (size: 'small' | 'medium' | 'large') => void;
  onContrastToggle?: () => void;
}

export default function AccessibilityBar({
  onLanguageChange,
  onFontSizeChange,
  onContrastToggle,
}: AccessibilityBarProps) {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleSkipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  const handleFontSizeIncrease = () => {
    const newSize = fontSize === 'large' ? 'large' : fontSize === 'medium' ? 'large' : 'medium';
    setFontSize(newSize);
    onFontSizeChange?.(newSize);
  };

  const handleFontSizeDecrease = () => {
    const newSize = fontSize === 'small' ? 'small' : fontSize === 'medium' ? 'small' : 'medium';
    setFontSize(newSize);
    onFontSizeChange?.(newSize);
  };

  const handleContrastToggle = () => {
    setIsHighContrast(!isHighContrast);
    onContrastToggle?.();
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageMenu(false);
    onLanguageChange?.(language);
  };

  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

  return (
    <div className={`${styles.accessibilityBar} ${isHighContrast ? styles.highContrast : ''}`}>
      <div className={styles.leftSection}>
        <div className={styles.govLogo}>
          <span className={styles.flagIcon}>
            <img src="/img/indian-flag.png" alt="India Flag" />
          </span>
          <span className={styles.govText}>Government of India</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.centerSection}>
            <a href="#main-content" className={styles.skipLink} onClick={handleSkipToContent}>Skip to Main Content</a>
        </div>
        <span className={styles.separator} aria-hidden="true">|</span>
        {/* Screen Reader */}
        <button
          className={styles.iconButton}
          title="Screen Reader"
          aria-label="Toggle Screen Reader"
        >          
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.50642 16.8429C1.09082 16.8429 0.735854 16.6957 0.441521 16.4014C0.147174 16.107 0 15.7521 0 15.3365V2.51602C0 2.10042 0.147174 1.74546 0.441521 1.45112C0.735854 1.15678 1.09082 1.0096 1.50642 1.0096H8.4054L7.15544 2.25958H1.50642C1.43163 2.25958 1.37019 2.28363 1.3221 2.33171C1.27402 2.37979 1.24998 2.44123 1.24998 2.51602V15.3365C1.24998 15.4113 1.27402 15.4727 1.3221 15.5208C1.37019 15.5689 1.43163 15.5929 1.50642 15.5929H10.1602C10.235 15.5929 10.2964 15.5689 10.3445 15.5208C10.3926 15.4727 10.4166 15.4113 10.4166 15.3365V13.3013H11.6666V15.3365C11.6666 15.7521 11.5195 16.107 11.2251 16.4014C10.9308 16.6957 10.5758 16.8429 10.1602 16.8429H1.50642ZM3.125 13.7179V12.4679H8.54163V13.7179H3.125ZM3.125 11.3141V10.0641H6.87496V11.3141H3.125ZM10.2083 11.0015L7.17146 7.96471H4.79167V4.21473H7.17146L10.2083 1.1779V11.0015ZM11.875 8.74836V3.43108C12.3376 3.7174 12.6963 4.09854 12.9511 4.5745C13.2059 5.05046 13.3333 5.55553 13.3333 6.08971C13.3333 6.62389 13.2045 7.12897 12.9471 7.60494C12.6896 8.0809 12.3322 8.46204 11.875 8.74836ZM11.875 12.1794V10.8622C12.7884 10.4829 13.5376 9.85815 14.1225 8.98796C14.7075 8.11777 15 7.15168 15 6.08971C15 5.02775 14.7075 4.06167 14.1225 3.19148C13.5376 2.32129 12.7884 1.69655 11.875 1.31727V0C13.1378 0.401708 14.1826 1.16292 15.0095 2.28365C15.8365 3.40437 16.2499 4.67306 16.2499 6.08971C16.2499 7.50638 15.8365 8.77507 15.0095 9.89579C14.1826 11.0165 13.1378 11.7777 11.875 12.1794Z" fill="#7A1E1C"/>
            </svg>
            <small className="ms-2">Screen Render</small>
        </button>
        <span className={styles.separator} aria-hidden="true">|</span>
        {/* Font Size Controls */}
        <div className={styles.fontControls}>
          <button
            className={styles.fontButton}
            onClick={handleFontSizeDecrease}
            title="Decrease Font Size"
            aria-label="Decrease Font Size"
          >
            A
            <span className={styles.minus}>−</span>
          </button>
          <button
            className={styles.fontButton}
            onClick={handleFontSizeIncrease}
            title="Increase Font Size"
            aria-label="Increase Font Size"
          >
            A
          </button>
          <button
            className={styles.fontButton}
            onClick={handleFontSizeIncrease}
            title="Increase Font Size"
            aria-label="Increase Font Size"
          >
            A
            <span className={styles.plus}>+</span>
          </button>
        </div>
        <span className={styles.separator} aria-hidden="true">|</span>
        {/* Contrast Toggle */}
        <button
          className={styles.iconButton}
          onClick={handleContrastToggle}
          title="Toggle High Contrast"
          aria-label="Toggle High Contrast"
        >          
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.33333 16.6667C12.9357 16.6667 16.6667 12.9357 16.6667 8.33333C16.6667 3.73096 12.9357 0 8.33333 0C3.73096 0 0 3.73096 0 8.33333C0 12.9357 3.73096 16.6667 8.33333 16.6667ZM8.33333 15.4167V1.25C12.2453 1.25 15.4167 4.42132 15.4167 8.33333C15.4167 12.2453 12.2453 15.4167 8.33333 15.4167Z" fill="#7A1E1C"/>
            </svg>
        </button>
        <span className={styles.separator} aria-hidden="true">|</span>
        {/* Language Selector */}
        <div className={styles.languageSelector}>
          <button
            className={styles.languageButton}
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            aria-label="Select Language"
            aria-expanded={showLanguageMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {selectedLanguage}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showLanguageMenu && (
            <div className={styles.languageMenu}>
              {languages.map((lang) => (
                <button
                  key={lang}
                  className={`${styles.languageItem} ${selectedLanguage === lang ? styles.active : ''}`}
                  onClick={() => handleLanguageSelect(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className={styles.separator} aria-hidden="true">|</span>
        {/* Accessibility Icon */}
        <button
          className={styles.iconButton}
          title="Accessibility"
          aria-label="Accessibility Options"
        >
            <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 3.69225C7.9885 3.69225 7.55292 3.5125 7.19325 3.153C6.83358 2.79333 6.65375 2.35775 6.65375 1.84625C6.65375 1.33475 6.83358 0.899166 7.19325 0.539499C7.55292 0.179832 7.9885 0 8.5 0C9.0115 0 9.44708 0.179832 9.80675 0.539499C10.1664 0.899166 10.3462 1.33475 10.3462 1.84625C10.3462 2.35775 10.1664 2.79333 9.80675 3.153C9.44708 3.5125 9.0115 3.69225 8.5 3.69225ZM5.904 19.5385V6.5C4.88467 6.41667 3.87117 6.2965 2.8635 6.1395C1.85583 5.98233 0.901333 5.78842 0 5.55775L0.3655 4.05775C1.64617 4.38858 2.97342 4.62833 4.34725 4.777C5.72092 4.92567 7.10517 5 8.5 5C9.89483 5 11.2791 4.92567 12.6528 4.777C14.0266 4.62833 15.3538 4.38858 16.6345 4.05775L17 5.55775C16.0987 5.78842 15.1442 5.98233 14.1365 6.1395C13.1288 6.2965 12.1153 6.41667 11.096 6.5V19.5385H9.59625V13.423H7.40375V19.5385H5.904Z" fill="#7A1E1C"/>
            </svg>
        </button>
      </div>
    </div>
  );
}
