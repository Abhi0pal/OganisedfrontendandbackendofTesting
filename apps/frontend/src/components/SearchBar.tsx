'use client';

import React, { useState } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({ 
  placeholder = 'Namaste! What can I find for you?',
  onSearch,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.searchBar} ${className}`}>
      <div className={styles.searchContainer}>
        <svg 
          className={styles.searchIcon}
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className={styles.input}
          aria-label="Search"
        />
      </div>
    </form>
  );
}
