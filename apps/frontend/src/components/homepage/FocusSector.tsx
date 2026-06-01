// components/home/FocusSector.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
type SectorState = 'hide-lft' | 'hide-ctr' | 'first' | 'current' | 'last' | 'hide-rgt'

interface SectorStates {
  energy: SectorState
  tourism: SectorState
  education: SectorState
  healthcare: SectorState
  industry: SectorState
  agri: SectorState
}

const FocusSector = () => {
  const t = useTranslations('FocusSector')
  const [activeSector, setActiveSector] = useState('energy')
  const [sectorStates, setSectorStates] = useState<SectorStates>({
    industry: 'hide-lft',
    agri: 'first',
    energy: 'current',
    tourism: 'last',
    education: 'hide-rgt',
    healthcare: 'hide-ctr'
  })

  const sectorData = {
    energy: {
      order: t('energy.order'),
      title: t('energy.title'),
      description: t('energy.description'),
      count: '600+',
      countLabel: t('approvedProjects')
    },
    tourism: {
      order: t('tourism.order'),
      title: t('tourism.title'),
      description: t('tourism.description'),
      count: '8000+',
      countLabel: t('approvedProjects')
    },
    education: {
      order: t('education.order'),
      title: t('education.title'),
      description: t('education.description'),
      count: '24k+',
      countLabel: t('schoolsColleges')
    },
    healthcare: {
      order: t('healthcare.order'),
      title: t('healthcare.title'),
      description: t('healthcare.description'),
      count: '600+',
      countLabel: t('approvedProjects')
    },
    industry: {
      order: t('industry.order'),
      title: t('industry.title'),
      description: t('industry.description'),
      count: '600+',
      countLabel: t('approvedProjects')
    },
    agri: {
      order: t('agri.order'),
      title: t('agri.title'),
      description: t('agri.description'),
      count: '600+',
      countLabel: t('approvedProjects')
    }
  }

  const handleSectorClick = (sector: string, currentState: SectorState) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    const newStates = { ...sectorStates }

    if (sector === 'energy') {
      if (currentState === 'last') {
        newStates.healthcare = 'hide-ctr'
        newStates.industry = 'hide-lft'
        newStates.agri = 'first'
        newStates.energy = 'current'
        newStates.tourism = 'last'
        newStates.education = 'hide-rgt'
      } else if (currentState === 'first') {
        newStates.healthcare = 'hide-ctr'
        newStates.industry = 'hide-lft'
        newStates.agri = 'first'
        newStates.energy = 'current'
        newStates.tourism = 'last'
        newStates.education = 'hide-rgt'
      }
    } else if (sector === 'tourism') {
      if (currentState === 'last') {
        newStates.industry = 'hide-ctr'
        newStates.healthcare = 'hide-rgt'
        newStates.agri = 'hide-lft'
        newStates.energy = 'first'
        newStates.tourism = 'current'
        newStates.education = 'last'
      } else if (currentState === 'first') {
        newStates.industry = 'hide-ctr'
        newStates.healthcare = 'hide-rgt'
        newStates.agri = 'hide-lft'
        newStates.energy = 'first'
        newStates.tourism = 'current'
        newStates.education = 'last'
      }
    } else if (sector === 'education') {
      if (currentState === 'last') {
        newStates.healthcare = 'last'
        newStates.energy = 'hide-lft'
        newStates.tourism = 'first'
        newStates.education = 'current'
        newStates.industry = 'hide-rgt'
        newStates.agri = 'hide-ctr'
      } else if (currentState === 'first') {
        newStates.healthcare = 'last'
        newStates.energy = 'hide-lft'
        newStates.tourism = 'first'
        newStates.education = 'current'
        newStates.industry = 'hide-rgt'
        newStates.agri = 'hide-ctr'
      }
    } else if (sector === 'healthcare') {
      if (currentState === 'last') {
        newStates.education = 'first'
        newStates.energy = 'hide-ctr'
        newStates.tourism = 'hide-lft'
        newStates.healthcare = 'current'
        newStates.industry = 'last'
        newStates.agri = 'hide-rgt'
      } else if (currentState === 'first') {
        newStates.education = 'first'
        newStates.energy = 'hide-ctr'
        newStates.tourism = 'hide-lft'
        newStates.healthcare = 'current'
        newStates.industry = 'last'
        newStates.agri = 'hide-rgt'
      }
    } else if (sector === 'industry') {
      if (currentState === 'last') {
        newStates.healthcare = 'first'
        newStates.tourism = 'hide-ctr'
        newStates.education = 'hide-lft'
        newStates.industry = 'current'
        newStates.agri = 'last'
        newStates.energy = 'hide-rgt'
      } else if (currentState === 'first') {
        newStates.healthcare = 'first'
        newStates.tourism = 'hide-ctr'
        newStates.education = 'hide-lft'
        newStates.industry = 'current'
        newStates.agri = 'last'
        newStates.energy = 'hide-rgt'
      }
    } else if (sector === 'agri') {
      if (currentState === 'last') {
        newStates.healthcare = 'hide-lft'
        newStates.education = 'hide-ctr'
        newStates.industry = 'first'
        newStates.agri = 'current'
        newStates.energy = 'last'
        newStates.tourism = 'hide-rgt'
      } else if (currentState === 'first') {
        newStates.healthcare = 'hide-lft'
        newStates.education = 'hide-ctr'
        newStates.industry = 'first'
        newStates.agri = 'current'
        newStates.energy = 'last'
        newStates.tourism = 'hide-rgt'
      }
    }

    setSectorStates(newStates)
    setActiveSector(sector)
  }

  return (
    <section className="section focus-sector">
      <div className="container">
        <div className="row">
          <div className="col-lg-12 col-xl-3">
            <div className="sector-control position-relative text-center pt-1">
              <h4 className="mb-1">{t('focusSectors')}</h4>
              <h3>{sectorData[activeSector as keyof typeof sectorData].order}</h3>
              
              <a 
                href="#" 
                className={`sector industry ${sectorStates.industry}`} 
                data-sector="industry" 
                title="Industry"
                onClick={handleSectorClick('industry', sectorStates.industry)}
              >
                <Image src="/img/focus-sectors/icons/industry-p.svg" alt="Industry" width={50} height={50} className="default" />
                <Image src="/img/focus-sectors/icons/industry-w.svg" alt="Industry" width={50} height={50} className="active" />
              </a>
              
              <a 
                href="#" 
                className={`sector agri ${sectorStates.agri}`} 
                data-sector="agri" 
                title="Agriculture"
                onClick={handleSectorClick('agri', sectorStates.agri)}
              >
                <Image src="/img/focus-sectors/icons/agri-p.svg" alt="Agriculture" width={50} height={50} className="default" />
                <Image src="/img/focus-sectors/icons/agri-w.svg" alt="Agriculture" width={50} height={50} className="active" />
              </a>
              
              <a 
                href="#" 
                className={`sector energy ${sectorStates.energy}`} 
                data-sector="energy" 
                title="Renewable Energy"
                onClick={handleSectorClick('energy', sectorStates.energy)}
              >
                <Image src="/img/focus-sectors/icons/energy-p.svg" alt="Renewable Energy" width={50} height={50} className="default" />
                <Image src="/img/focus-sectors/icons/energy-w.svg" alt="Renewable Energy" width={50} height={50} className="active" />
              </a>
              
              <a 
                href="#" 
                className={`sector tourism ${sectorStates.tourism}`} 
                data-sector="tourism" 
                title="Tourism & Hospitality"
                onClick={handleSectorClick('tourism', sectorStates.tourism)}
              >
                <Image src="/img/focus-sectors/icons/travel-p.svg" alt="Tourism" width={50} height={50} className="default" />
                <Image src="/img/focus-sectors/icons/travel-w.svg" alt="Tourism" width={50} height={50} className="active" />
              </a>
              
              <a 
                href="#" 
                className={`sector education ${sectorStates.education}`} 
                data-sector="education" 
                title="Education"
                onClick={handleSectorClick('education', sectorStates.education)}
              >
                <Image src="/img/focus-sectors/icons/education-p.svg" alt="Education" width={50} height={50} className="default" />
                <Image src="/img/focus-sectors/icons/education-w.svg" alt="Education" width={50} height={50} className="active" />
              </a>
              
              <a 
                href="#" 
                className={`sector healthcare ${sectorStates.healthcare}`} 
                data-sector="healthcare" 
                title="Healthcare"
                onClick={handleSectorClick('healthcare', sectorStates.healthcare)}
              >
                <Image src="/img/focus-sectors/icons/healthcare-p.svg" alt="Healthcare" width={50} height={50} className="default" />
                <Image src="/img/focus-sectors/icons/healthcare-w.svg" alt="Healthcare" width={50} height={50} className="active" />
              </a>
            </div>

            {/* Sector Descriptions */}
            <div className="sector-description">
              {Object.entries(sectorData).map(([key, data]) => (
                <div 
                  key={key} 
                  className={`sd-box ${key}-box ${activeSector !== key ? 'd-none' : ''}`}
                >
                  <h3 className="mb-3">{data.title}</h3>
                  <p className="mb-4">{data.description}</p>
                  <div className="d-flex align-items-start mb-5 justify-content-lg-start justify-content-center">
                    <Image src="/img/icons/certificate.svg" alt="Certificate" width={40} height={40} className="me-3 mt-2" />
                    <div className="sector-count d-flex">
                      <span>{data.count}</span>
                      <small>{data.countLabel}</small>
                    </div>
                  </div>
                  <a href="#" className="btn btn-primary rounded-5 btn-animate">
                    {t('viewSectorProfile')}
                    <Image src="/img/icons/arrow-rgt-w.svg" alt="Arrow" width={20} height={20} className="ms-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Images Section */}
          <div className="col-lg-12 col-xl-9">
            {/* Healthcare Images */}
            <div className={`sector-images healthcare-image ${activeSector !== 'healthcare' ? 'd-none' : ''}`}>
              <div className="rc-carousel" style={{ ['--tiles' as string]: 18 }}>
                <div className="rc-carousel-strip reverse">
                  <div className="rc-carousel-box">
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((item, index) => (
                      <div key={index} className="rc-carousel-item">
                        <div className="sector-img-wrap position-relative wow bounceIn" data-wow-duration="0.8s" data-wow-delay={`${index * 0.3}s`}>
                          <div className="overlay-txt position-absolute p-4 rounded-4 d-flex">
                            <h5 className="mb-2">{item === 1 ? 'MAX Hospital' : item === 2 ? 'Synergy Hospital' : 'Graphic Era Hospital'}</h5>
                            <small>{item === 1 ? 'Dehradun' : item === 2 ? 'Dehradun' : 'Dhakrani'}</small>
                            <h4 className="mt-4">{item === 1 ? '63 ICU Beds' : item === 2 ? '55 ICU Beds' : '125 CC Beds'}</h4>
                          </div>
                          <Image 
                            src={`/img/focus-sectors/healthcare/${item}.jpg`} 
                            alt={item === 1 ? 'MAX Hospital' : item === 2 ? 'Synergy Hospital' : 'Graphic Era Hospital'}
                            width={400}
                            height={300}
                            className="rounded-4 img-fluid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Renewable Energy Images */}
            <div className={`sector-images energy-image ${activeSector !== 'energy' ? 'd-none' : ''}`}>
              <div className="rc-carousel" style={{ ['--tiles' as string]: 18 }}>
                <div className="rc-carousel-strip reverse">
                  <div className="rc-carousel-box">
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((item, index) => (
                      <div key={index} className="rc-carousel-item">
                        <div className="sector-img-wrap position-relative wow bounceIn" data-wow-duration="0.8s" data-wow-delay={`${index * 0.3}s`}>
                          <div className="overlay-txt position-absolute p-4 rounded-4 d-flex">
                            <h5 className="mb-2">{item === 1 ? 'Bhagwanpur solar plant' : item === 2 ? 'Rays Power Infra' : 'UJVNL Solar PV Plants'}</h5>
                            <small>{item === 1 ? 'Roorkee' : item === 2 ? 'Haridwar' : 'Dhakrani'}</small>
                            <h4 className="mt-4">{item === 1 ? '65 MW' : item === 2 ? '78 MW' : '45 MW'}</h4>
                          </div>
                          <Image 
                            src={`/img/focus-sectors/renewable-energy/${item}.jpg`} 
                            alt={item === 1 ? 'Bhagwanpur solar plant' : item === 2 ? 'Rays Power Infra' : 'UJVNL Solar PV Plants'}
                            width={400}
                            height={300}
                            className="rounded-4 img-fluid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Education Images */}
            <div className={`sector-images education-image ${activeSector !== 'education' ? 'd-none' : ''}`}>
              <div className="rc-carousel" style={{ ['--tiles' as string]: 18 }}>
                <div className="rc-carousel-strip reverse">
                  <div className="rc-carousel-box">
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((item, index) => (
                      <div key={index} className="rc-carousel-item">
                        <div className="sector-img-wrap position-relative wow bounceIn" data-wow-duration="0.8s" data-wow-delay={`${index * 0.3}s`}>
                          <div className="overlay-txt position-absolute p-4 rounded-4 d-flex">
                            <h5 className="mb-2">{item === 1 ? 'The Doon School' : item === 2 ? 'IIT' : 'Woodstock School'}</h5>
                            <small>{item === 1 ? 'Dehradun' : item === 2 ? 'Roorkee' : 'Mussoorie'}</small>
                            <h4 className="mt-4">{item === 1 ? 'ESTD : 1935' : item === 2 ? 'ESTD : 1847' : 'ESTD : 1854'}</h4>
                          </div>
                          <Image 
                            src={`/img/focus-sectors/education/${item}.jpg`} 
                            alt={item === 1 ? 'The Doon School' : item === 2 ? 'IIT' : 'Woodstock School'}
                            width={400}
                            height={300}
                            className="rounded-4 img-fluid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tourism Images */}
            <div className={`sector-images tourism-image ${activeSector !== 'tourism' ? 'd-none' : ''}`}>
              <div className="rc-carousel" style={{ ['--tiles' as string]: 18 }}>
                <div className="rc-carousel-strip reverse">
                  <div className="rc-carousel-box">
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((item, index) => (
                      <div key={index} className="rc-carousel-item">
                        <div className="sector-img-wrap position-relative wow bounceIn" data-wow-duration="0.8s" data-wow-delay={`${index * 0.3}s`}>
                          <div className="overlay-txt position-absolute p-4 rounded-4 d-flex">
                            <h5 className="mb-2">{item === 1 ? 'Taj Mussoorie Foothills' : item === 2 ? 'River Rafting' : 'Floating Huts'}</h5>
                            <small>{item === 1 ? 'Taj Mussoorie Foothills' : item === 2 ? 'Rishikesh' : 'Tehri'}</small>
                            <h4 className="mt-4">{item === 1 ? '5 Star Hotel' : item === 2 ? 'Adventures' : 'Premium Services'}</h4>
                          </div>
                          <Image 
                            src={`/img/focus-sectors/tourism/${item}.jpg`} 
                            alt={item === 1 ? 'Taj Mussoorie Foothills' : item === 2 ? 'River Rafting' : 'Floating Huts'}
                            width={400}
                            height={300}
                            className="rounded-4 img-fluid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Industry Images */}
            <div className={`sector-images industry-image ${activeSector !== 'industry' ? 'd-none' : ''}`}>
              <div className="rc-carousel" style={{ ['--tiles' as string]: 18 }}>
                <div className="rc-carousel-strip reverse">
                  <div className="rc-carousel-box">
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((item, index) => (
                      <div key={index} className="rc-carousel-item">
                        <div className="sector-img-wrap position-relative">
                          <Image 
                            src={`/img/focus-sectors/industry/${item}.jpg`} 
                            alt="Industry"
                            width={400}
                            height={300}
                            className="rounded-4 img-fluid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Agriculture Images */}
            <div className={`sector-images agri-image ${activeSector !== 'agri' ? 'd-none' : ''}`}>
              <div className="rc-carousel" style={{ ['--tiles' as string]: 18 }}>
                <div className="rc-carousel-strip reverse">
                  <div className="rc-carousel-box">
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((item, index) => (
                      <div key={index} className="rc-carousel-item">
                        <div className="sector-img-wrap position-relative">
                          <Image 
                            src={`/img/focus-sectors/agri/${item}.jpg`} 
                            alt="Agriculture"
                            width={400}
                            height={300}
                            className="rounded-4 img-fluid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FocusSector
