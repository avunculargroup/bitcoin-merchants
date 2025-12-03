import HomeHero from "@/components/HomeHero";
import WhyBitcoin from "@/components/WhyBitcoin";
import GetOnMap from "@/components/GetOnMap";
import MeetTeamCard from "@/components/MeetTeamCard";
import SquareSection from "@/components/SquareSection";
import POSOptions from "@/components/POSOptions";
import OnlinePayment from "@/components/OnlinePayment";
import HomeFAQ from "@/components/HomeFAQ";
import ContactSupportCard from "@/components/ContactSupportCard";

export default function Home() {
  return (
    <main>
      <HomeHero />
      <WhyBitcoin />
      <GetOnMap />
      <SquareSection />
      <POSOptions />
      <MeetTeamCard />
      <OnlinePayment />
      <ContactSupportCard />
      <HomeFAQ />
    </main>
  );
}
