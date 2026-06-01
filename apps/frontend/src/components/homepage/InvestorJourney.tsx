'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const InvestorJourney = () => {
  const t = useTranslations('InvestorJourney')
  const [currentIndex, setCurrentIndex] = useState(0)

  const journeySteps = [
    {
      id: 1,
      icon: '/img/icons/ij-1.svg',
      titleKey: 'Step1',
      level: 'level-1'
    },
    {
      id: 2,
      icon: '/img/icons/ij-2.svg',
      titleKey: 'Step2',
      titleBreak: true,
      level: 'level-2'
    },
    {
      id: 3,
      icon: '/img/icons/ij-3.svg',
      titleKey: 'Step3',
      titleBreak: true,
      level: 'level-3'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % journeySteps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [journeySteps.length])

  return (
    <section className="investor-journey">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-sm-12 col-md-8">
            <div className="highway-wrap position-relative">
              <img
                src="/img/truck.svg"
                className={`truck position-absolute ${journeySteps[currentIndex].level}`}
                alt={t('Truck')}
              />

              <div className="row position-relative z-1">
                {journeySteps.map((step, index) => (
                  <div key={step.id} className="col-md-4 position-relative">
                    <div
                      className={`journey-point d-flex p-4 text-center ${
                        currentIndex === index ? 'active' : ''
                      }`}
                    >
                      <img src={step.icon} className="mb-3" alt={t(step.titleKey)} />

                      <h4>
                        {step.titleBreak ? (
                          <>
                            {t(step.titleKey).split(' & ')[0]} & <br />
                            {t(step.titleKey).split(' & ')[1]}
                          </>
                        ) : (
                          t(step.titleKey)
                        )}
                      </h4>
                    </div>

                    <a href="#" className="stop" onClick={(e) => e.preventDefault()} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-sm-12 col-md-3 offset-md-1 text-end">
            <h2 className="section-sub-heading">
              {t('SubHeading')}
            </h2>
            <h2 className="section-heading mb-5">
              <span>{t('MainHeading')}</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InvestorJourney
