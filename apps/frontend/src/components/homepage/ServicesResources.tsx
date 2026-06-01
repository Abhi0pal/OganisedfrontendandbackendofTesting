// components/home/ServicesResources.tsx

import React from 'react'
import Image from 'next/image'
import { useTranslations } from "next-intl";
const ServicesResources = () => {
  const t = useTranslations("ServiceResources");
  const services = [
    {
      id: 1,
      titleKey: 'KnowYourApprovals.title',
      descKey: 'KnowYourApprovals.description',
      image: '/img/services/know_your_approvals.jpg',
      link: '#',
      delay: '0s'
    },
    {
      id: 2,
      titleKey: 'LandBank.title',
      descKey: 'LandBank.description',
      image: '/img/services/land-bank.jpg',
      link: '#',
      delay: '0.3s'
    },
    {
      id: 3,
      titleKey: 'Policies.title',
      descKey: 'Policies.description',
      image: '/img/services/policies-and-incentives.jpg',
      link: '#',
      delay: '0.6s'
    },
    {
      id: 4,
      titleKey: 'IncentiveCalculator.title',
      descKey: 'IncentiveCalculator.description',
      image: '/img/services/incentive-calculator.jpg',
      link: '#',
      delay: '0.9s'
    },
    {
      id: 5,
      titleKey: 'GovtOrderAct.title',
      descKey: 'GovtOrderAct.description',
      image: '/img/services/order-and-act.jpg',
      link: '#',
      delay: '1.2s'
    },
    {
      id: 6,
      titleKey: 'GrievanceTicket.title',
      descKey: 'GrievanceTicket.description',
      image: '/img/services/grievance-and-ticket.jpg',
      link: '#',
      delay: '1.5s'
    }
  ]

  return (
    <section className="section services-and-resources">
      <div className="container">
        <h2 className="section-heading mb-5">
          {t("Investor")} <span> {t("Services & Resources")}</span>
        </h2>
        <div className="row">
          {services.map((service) => (
            <div
              key={service.id}
              className={`col-md-4 col-sm-12 ${service.id <= 3 ? 'mb-5' : service.id <= 5 ? 'mb-5 mb-md-0' : ''
                }`}
            >
              <div className="card border-0">
                <div className="position-relative rounded-4 overflow-hidden wow flipInX" data-wow-duration="0.8s" data-wow-delay={service.delay}>
                  <Image
                    src={service.image}
                    alt={t(service.titleKey)}
                    width={400}
                    height={300}
                    className="card-img-top"
                    style={{ height: 'auto' }}
                  />
                </div>
                <div className="card-body p-0 pt-3">
                  <h5
                    className="card-title wow fadeInUp"
                    data-wow-duration="0.8s"
                    data-wow-delay={service.delay}
                  >
                    {t(service.titleKey)}
                  </h5>
                  <p
                    className="card-text mb-4 wow fadeInUp"
                    data-wow-duration="0.8s"
                    data-wow-delay={service.delay}
                  >
                    {t(service.descKey)}
                  </p>
                  <a
                    href={service.link}
                    className="btn btn-outline-primary rounded-5 btn-animate wow fadeIn"
                    data-wow-duration="0.8s"
                    data-wow-delay={service.delay}
                  >
                    {t('Explore Now')}
                    <Image
                      src="/img/icons/arrow-rgt-p.svg"
                      className="default ms-3"
                      alt="Arrow"
                      width={20}
                      height={20}
                    />
                    <Image
                      src="/img/icons/arrow-rgt-w.svg"
                      className="active ms-3"
                      alt="Arrow"
                      width={20}
                      height={20}
                    />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesResources
