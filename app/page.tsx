import HomeHero from "@/components/HomeHero";
import WhyBitcoin from "@/components/WhyBitcoin";
import GetOnMap from "@/components/GetOnMap";
import SquareSection from "@/components/SquareSection";
import POSOptions from "@/components/POSOptions";
import OnlinePayment from "@/components/OnlinePayment";
import HomeFAQ from "@/components/HomeFAQ";

export default function Home() {
  return (
    <main>
      <HomeHero />
      <WhyBitcoin />
      <GetOnMap />
      <SquareSection />
      <POSOptions />
      <OnlinePayment />
      <HomeFAQ />
    </main>
  );
}
