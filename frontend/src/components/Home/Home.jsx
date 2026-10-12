import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import PopularCategories from "./PopularCategories";

const Home = () => {
  return (
    <main className="homePage">
      <HeroSection />
      <HowItWorks />
      <PopularCategories />
    </main>
  );
};

export default Home;
