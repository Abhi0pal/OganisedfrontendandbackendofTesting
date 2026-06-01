// components/home/NewsTicker.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'

const NewsTicker = () => {
  const tickerWrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  const newsItems = [
    {
      id: 1,
      title: 'Apple Mission: UTPADAC',
      url: '/themes/backend/acts/act_english1708085497.pdf'
    },
    {
      id: 2,
      title: 'Mega Industrial and Investment Policy 2021',
      url: '/themes/backend/acts/act_english1665390207.pdf'
    },
    {
      id: 3,
      title: 'The Uttarakhand Logistics Policy, 2023',
      url: '/themes/backend/acts/act_english1676890303.pdf'
    },
    {
      id: 4,
      title: 'Uttarakhand Drone Promotion & Usage Policy 2023',
      url: '/themes/backend/acts/act_english1692357272.pdf'
    },
    {
      id: 5,
      title: 'Uttarakhand Drone Policy, 2023',
      url: '/themes/backend/acts/act_english1692357272.pdf'
    },
    {
      id: 6,
      title: 'Uttarakhand State Solar Policy, 2023',
      url: '/themes/backend/acts/act_english1692357589.pdf'
    },
    {
      id: 7,
      title: 'Uttarakhand Micro, Small and Medium Enterprises Policy (MSME), 2023',
      url: '/themes/backend/acts/act_english1694183094.pdf'
    },
    {
      id: 8,
      title: 'The Policy for the establishment of Private Industrial Estates/Areas-2023',
      url: '/themes/backend/acts/act_english1713169036.pdf'
    },
    {
      id: 9,
      title: 'Policy for Power Generation from Pirul (Pine Leaves) and Other Biomass–2018',
      url: '/themes/backend/acts/act_english1560402622.pdf'
    },
    {
      id: 10,
      title: 'Uttarakhand Small Hydro Power 2 to 25 MW - Policy',
      url: '/themes/backend/acts/act_english1547551098.pdf'
    }
  ]

  const handleMouseEnter = () => setIsPaused(true)
  const handleMouseLeave = () => setIsPaused(false)

  return (
    <div className="important-news position-relative">
      <div 
        className="newsticker" 
        ref={tickerWrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`ticker-wrap ${isPaused ? 'paused' : ''}`} 
          ref={listRef}
        >
          {/* First set */}
          {newsItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
          ))}
          
          {/* Cloned for seamless loop */}
          {newsItems.map((item) => (
            <a
              key={`clone-${item.id}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.title}
            </a>
          ))}
          
          <a href="#" className="last"></a>
        </div>
      </div>
    </div>
  )
}

export default NewsTicker
