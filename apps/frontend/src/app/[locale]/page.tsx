import Testimonials from "@/components/homepage/Testimonial"
import FocusSector from "@/components/homepage/FocusSector"
import DistrictWisePerformanceMap from "@/components/homepage/DistrictWisePerformanceMap"
import Banner from "@/components/homepage/Banner"
import NewsTicker from "@/components/homepage/NewsTicker"
import ServicesResources from "@/components/homepage/ServicesResources"
import InvestorJourney from "@/components/homepage/InvestorJourney"
import JharkhandAssistant from "@/components/common/Floatingchat"
export default function Home() {
    return (
      <div>
        <Banner />
        <NewsTicker />
        
        <ServicesResources />
        <InvestorJourney />
        <FocusSector /> 
        <DistrictWisePerformanceMap/>
  
        <Testimonials />
        <JharkhandAssistant></JharkhandAssistant>
      </div>
     
    )
  }