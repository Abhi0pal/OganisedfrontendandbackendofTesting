'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const AUTO_SCROLL_INTERVAL = 3000
const SLIDE_WIDTH = 474.4
const VISIBLE_SLIDES = 3

type Testimonial = {
  id: number
  image: string
  quote: string
  name: string
  title: string
}

const cloneSlidesForInfinite = (items: Testimonial[], visible: number) => {
  return [
    ...items.slice(-visible),
    ...items,
    ...items.slice(0, visible)
  ]
}

const Testimonials = () => {
  const t = useTranslations('Testimonials')

  const testimonials: Testimonial[] = [
    {
      id: 1,
      image: '/img/testimonials/1.png',
      quote: t('Quote1'),
      name: t('Name1'),
      title: t('Title1')
    },
    {
      id: 2,
      image: '/img/testimonials/2.png',
      quote: t('Quote2'),
      name: t('Name2'),
      title: t('Title2')
    },
    {
      id: 3,
      image: '/img/testimonials/3.png',
      quote: t('Quote3'),
      name: t('Name3'),
      title: t('Title3')
    },
    {
      id: 4,
      image: '/img/testimonials/1.png',
      quote: t('Quote4'),
      name: t('Name4'),
      title: t('Title4')
    },
    {
      id: 5,
      image: '/img/testimonials/2.png',
      quote: t('Quote5'),
      name: t('Name5'),
      title: t('Title5')
    }
  ]

  const TOTAL_SLIDES = testimonials.length

  const [allSlides, setAllSlides] = useState<Testimonial[]>(
    cloneSlidesForInfinite(testimonials, VISIBLE_SLIDES)
  )
  const [currentIndex, setCurrentIndex] = useState(TOTAL_SLIDES)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto scroll
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide(currentIndex + 1)
    }, AUTO_SCROLL_INTERVAL)

    return () => clearInterval(timer)
  }, [currentIndex])

  // Infinite loop correction
  useEffect(() => {
    if (!isTransitioning) return

    const timer = setTimeout(() => {
      setIsTransitioning(false)

      if (currentIndex === 0) {
        setCurrentIndex(TOTAL_SLIDES)
      } else if (currentIndex === allSlides.length - VISIBLE_SLIDES) {
        setCurrentIndex(TOTAL_SLIDES - 1)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [currentIndex, isTransitioning, allSlides.length])

  const goToSlide = (index: number) => {
    setIsTransitioning(true)
    setCurrentIndex(index)
  }

  const handlePrev = () => goToSlide(currentIndex - 1)
  const handleNext = () => goToSlide(currentIndex + 1)

  const getSlideClass = (idx: number) => {
    if (idx === currentIndex) return 'swiper-slide swiper-slide-active'
    if (idx === currentIndex - 1) return 'swiper-slide swiper-slide-prev'
    if (idx === currentIndex + 1) return 'swiper-slide swiper-slide-next'
    return 'swiper-slide'
  }

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    transition: isTransitioning ? 'transform 0.3s ease-in-out' : 'none',
    transform: `translateX(-${currentIndex * SLIDE_WIDTH}px)`
  }

  return (
    <section className="section-testmonials">
      <div className="container position-relative">
        <div className="column-testmonials">
          <div className="section-details">
            <h2 className="section-heading mb-5">
              {t('Stories of')} <br />
              <span>{t('Experience')}</span>
            </h2>
          </div>

          <div className="navigation-testmonials">
            <div
              className="swiper-button-testmonials-prev"
              onClick={handlePrev}
            >
              <img src="/img/testimonials/arrow-lft.png" alt="Previous" />
            </div>

            <div
              className="swiper-button-testmonials-next"
              onClick={handleNext}
            >
              <img src="/img/testimonials/arrow-rgt.png" alt="Next" />
            </div>
          </div>
        </div>

        <div className="swiper-testmonials">
          <div className="swiper-wrapper" style={wrapperStyle}>
            {allSlides.map((testimonial, idx) => (
              <div
                key={`${testimonial.id}-${idx}`}
                className={getSlideClass(idx)}
                style={{
                  width: SLIDE_WIDTH,
                  minWidth: SLIDE_WIDTH,
                  flex: '0 0 auto'
                }}
              >
                <div className="speaker-box">
                  <div className="d-flex justify-content-between align-items-center mb-5">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="speaker-img"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%'
                      }}
                    />
                    <img
                      src="/img/icons/icon-quote.svg"
                      alt="Quote"
                      width={50}
                      height={50}
                    />
                  </div>

                  <p>{testimonial.quote}</p>
                  <h3>{testimonial.name}</h3>
                  <small>{testimonial.title}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
export default Testimonials
