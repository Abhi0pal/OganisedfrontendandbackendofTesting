
'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

const Banner = () => {
  const [activeSlide, setActiveSlide] = useState(0)
  const totalSlides = 6

  // Auto-play carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleSlideChange = (slideIndex: number) => {
    setActiveSlide(slideIndex)
  }

  return (
    <div id="content">
      <div id="carouselExampleIndicators" className="main-banner carousel slide">
        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {[...Array(totalSlides)].map((_, index) => (
            <button
              key={index}
              type="button"
              className={activeSlide === index ? 'active' : ''}
              aria-current={activeSlide === index ? 'true' : 'false'}
              aria-label={`Slide ${index + 1}`}
              onClick={() => handleSlideChange(index)}
            />
          ))}
        </div>

        {/* Carousel Images */}
        <div className="carousel-inner">
          {[1, 2, 3, 4, 5, 6].map((num, index) => (
            <div
              key={index}
              className={`carousel-item ${activeSlide === index ? 'active' : ''}`}
              id={String(index)}
            >
              <img
                src={`/img/banner/img-${num}.jpg`}
                className="d-block w-100"
                alt="Invest Uttarakhand"
              />
            </div>
          ))}
        </div>

        {/* Banner Content */}
        <div className="banner-content-wrap">
          <div className="container-fluid">
            <div className="bcw-inner">
              <div className="bci-lft">
                {/* Slide 0 - CM Image */}
                <div className={`b-txt ${activeSlide !== 0 ? 'd-none' : ''}`} id="slier-0">
                  <div className="row">
                    <div className="col-sm-12 col-md-7 order-2 order-sm-1">
                      <h1 className="wow fadeInRight" data-wow-duration="0.8s" data-wow-delay="0s">
                        One Window,<br /> Many Opportunities
                      </h1>
                      <p className="wow fadeInRight" data-wow-duration="1.0s" data-wow-delay="0s">
                        Unlock growth opportunities in Uttarakhand&apos;s thriving industries with smart investments.
                      </p>
                      <a
                        href="https://investuttarakhand.uk.gov.in/investmenttracking/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary rounded-5 wow fadeInRight"
                        data-wow-duration="1.2s"
                        data-wow-delay="0s"
                      >
                        Explore the Investor Proposal
                      </a>
                    </div>
                    <div className="col-sm-12 col-md-5 text-center text-sm-end order-1 order-sm-2 mb-4 mb-sm-0">
                      <img
                        src="/img/banner/img-cm.png"
                        alt=""
                        className="rs-content cm-img img-fluid wow fadeIn"
                        data-wow-duration="1s"
                        data-wow-delay="0.1s"
                      />
                    </div>
                  </div>
                </div>

                {/* Slide 1 - Key Portals */}
                <div className={`b-txt ${activeSlide !== 1 ? 'd-none' : ''}`} id="slier-1">
                  <div className="row">
                    <div className="col-sm-12 col-md-7">
                      <h1 className="wow fadeInRight" data-wow-duration="0.8s" data-wow-delay="0s">
                        One Stop.<br /> All Investment Needs
                      </h1>
                      <p className="wow fadeInRight" data-wow-duration="1.0s" data-wow-delay="0s">
                        Track, verify, and control
                      </p>
                      <img src="/img/banner/img-process.png" className="img-fluid" alt="" />
                    </div>
                    <div className="col-sm-12 col-md-5 text-end">
                      <div className="key-portal-wrap rs-content wow fadeIn" data-wow-duration="1s" data-wow-delay="0.1s">
                        <h3>
                          <span>Key Portal</span> Links
                        </h3>
                        <div className="row mt-3 mt-sm-5">
                          <div className="col col-sm-4 mb-2 mb-sm-5">
                            <a
                              href="https://investuttarakhand.uk.gov.in/investorsummit/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kp-box text-center"
                            >
                              <span className="mx-auto">
                                <img src="/img/icons/kp-1.svg" alt="Investment Promotion" />
                              </span>
                              <h4>Investment Promotion</h4>
                            </a>
                          </div>
                          <div className="col col-sm-4 mb-2 mb-sm-5">
                            <a
                              href="https://investuttarakhand.uk.gov.in/investmenttracking/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kp-box text-center"
                            >
                              <span className="mx-auto">
                                <img src="/img/icons/kp-2.svg" alt="Investment Tracking" />
                              </span>
                              <h4>Investment Tracking</h4>
                            </a>
                          </div>
                          <div className="col col-sm-4 mb-2 mb-sm-5">
                            <a
                              href="https://msy.uk.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kp-box text-center"
                            >
                              <span className="mx-auto">
                                <img src="/img/icons/kp-3.svg" alt="Employment Schemes" />
                              </span>
                              <h4>Employment Schemes</h4>
                            </a>
                          </div>
                          <div className="col col-sm-4 mb-2 mb-sm-0">
                            <a
                              href="https://uhhdc.uk.gov.in"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kp-box text-center"
                            >
                              <span className="mx-auto">
                                <img src="/img/icons/kp-4.svg" alt="Handloom & Handicraft" />
                              </span>
                              <h4>Handloom & Handicraft</h4>
                            </a>
                          </div>
                          <div className="col col-sm-4">
                            <a
                              href="https://startuputtarakhand.uk.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kp-box text-center"
                            >
                              <span className="mx-auto">
                                <img src="/img/icons/kp-5.svg" alt="Startup Portal" />
                              </span>
                              <h4>
                                Startup
                                <br /> Portal
                              </h4>
                            </a>
                          </div>
                          <div className="col col-sm-4">
                            <a
                              href="https://investuttarakhand.uk.gov.in/site/importantLink"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kp-box text-center h-100 view-more"
                            >
                              View
                              <br />
                              More
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2 - Tourism */}
                <div className={`b-txt ${activeSlide !== 2 ? 'd-none' : ''}`} id="slier-2">
                  <div className="row">
                    <div className="col-sm-12 col-md-7">
                      <h1 className="wow fadeInRight last-title" data-wow-duration="0.8s" data-wow-delay="0s">
                        Build a stronger tomorrow by investing today
                      </h1>
                      <p className="wow fadeInRight" data-wow-duration="1.0s" data-wow-delay="0s">
                        offering spirituality, adventure, and natural beauty.
                      </p>
                      <a
                        href="https://investuttarakhand.uk.gov.in/investmenttracking/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary rounded-5 wow fadeInRight"
                        data-wow-duration="1.2s"
                        data-wow-delay="0s"
                      >
                        Explore the Investor Proposal
                      </a>
                    </div>
                    <div className="col-sm-12 col-md-5 text-end">
                      <img
                        src="/img/banner/tourism-collage.png"
                        alt=""
                        className="rs-content img-fluid wow fadeIn"
                        data-wow-duration="1s"
                        data-wow-delay="0.1s"
                      />
                    </div>
                  </div>
                </div>

                {/* Slide 3 - Education */}
                <div className={`b-txt ${activeSlide !== 3 ? 'd-none' : ''}`} id="slier-3">
                  <div className="row">
                    <div className="col-sm-12 col-md-7">
                      <h1 className="wow fadeInRight last-title" data-wow-duration="0.8s" data-wow-delay="0s">
                        Learn Without <br />
                        Limits
                      </h1>
                      <p className="wow fadeInRight" data-wow-duration="1.0s" data-wow-delay="0s">
                        Discover courses, skills, and mentors to accelerate your growth.
                      </p>
                      <a
                        href="https://investuttarakhand.uk.gov.in/investmenttracking/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary rounded-5 wow fadeInRight"
                        data-wow-duration="1.2s"
                        data-wow-delay="0s"
                      >
                        Explore the Investor Proposal
                      </a>
                    </div>
                    <div className="col-sm-12 col-md-5 text-end">
                      <img
                        src="/img/banner/tourism-collage.png"
                        alt=""
                        className="rs-content wow fadeIn d-none"
                        data-wow-duration="1s"
                        data-wow-delay="0.1s"
                      />
                    </div>
                  </div>
                </div>

                {/* Slide 4 - Healthcare with Metrics */}
                <div className={`b-txt ${activeSlide !== 4 ? 'd-none' : ''}`} id="slier-4">
                  <div className="row">
                    <div className="col-sm-12 col-md-7">
                      <h1 className="wow fadeInRight last-title" data-wow-duration="0.8s" data-wow-delay="0s">
                        Caring Beyond Treatment
                      </h1>
                      <p className="wow fadeInRight" data-wow-duration="1.0s" data-wow-delay="0s">
                        Committed to your health, healing, and holistic well-being.
                      </p>
                      <a
                        href="https://investuttarakhand.uk.gov.in/investmenttracking/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary rounded-5 wow fadeInRight"
                        data-wow-duration="1.2s"
                        data-wow-delay="0s"
                      >
                        Explore the Investor Proposal
                      </a>
                    </div>
                    <div className="col-sm-12 col-md-5 text-end mt-3 mt-sm-0">
                      <div className="bg-white key-metrics-wrap rs-content wow fadeIn" data-wow-duration="1s" data-wow-delay="0.1s">
                        <h3>
                          <span>Statistics</span> Highlights & <span>Key Metrics</span>
                        </h3>
                        <div className="row mt-3 mt-sm-3 text-center">
                          <div className="col col-sm-4 mb-2 mb-sm-4">
                            <h4>68%</h4>
                            <span>
                              CIS <br />
                              (Inspections)
                            </span>
                          </div>
                          <div className="col col-sm-4 mb-2 mb-sm-4">
                            <h4>8.2%</h4>
                            <span>
                              Investor <br />
                              Dashboard
                            </span>
                          </div>
                          <div className="col col-sm-4 mb-2 mb-sm-4">
                            <h4>3rd</h4>
                            <span>
                              Incentive <br />
                              Dashboard
                            </span>
                          </div>
                          <div className="col col-sm-4">
                            <h4>25k+</h4>
                            <span>
                              Queries <br />
                              Module
                            </span>
                          </div>
                          <div className="col col-sm-4">
                            <h4>71%</h4>
                            <span>
                              Grievance <br />
                              Module
                            </span>
                          </div>
                          <div className="col col-sm-4">
                            <h4>15+</h4>
                            <span>
                              User <br />
                              Feedbacks
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 5 - Agriculture */}
                <div className={`b-txt ${activeSlide !== 5 ? 'd-none' : ''}`} id="slier-5">
                  <div className="row">
                    <div className="col-sm-12 col-md-7">
                      <h1 className="wow fadeInRight last-title" data-wow-duration="0.8s" data-wow-delay="0s">
                        Smart Agriculture & Horticulture
                      </h1>
                      <p className="wow fadeInRight" data-wow-duration="1.0s" data-wow-delay="0s">
                        Empowering Farmers, Enriching the Nation.
                      </p>
                      <a
                        href="https://investuttarakhand.uk.gov.in/investmenttracking/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary rounded-5 wow fadeInRight"
                        data-wow-duration="1.2s"
                        data-wow-delay="0s"
                      >
                        Explore the Investor Proposal
                      </a>
                    </div>
                    <div className="col-sm-12 col-md-5 text-end">
                      <img
                        src="/img/banner/tourism-collage.png"
                        alt=""
                        className="rs-content wow fadeIn d-none"
                        data-wow-duration="1s"
                        data-wow-delay="0.1s"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Banner
