import { FaArrowRight, FaBriefcase, FaRegCompass, FaRegFileAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="heroSection">
      <div className="hero-container">
        <div className="hero-copy">
          <span className="hero-kicker">Build your future</span>
          <h1>
            Make your next move <em>matter.</em>
          </h1>
          <p>
            Find work that fits your life, your strengths, and where you want to
            go next. Your next chapter starts with a better search.
          </p>
          <div className="hero-actions">
            <Link className="button-primary" to="/job/getall">
              Explore opportunities <FaArrowRight aria-hidden="true" />
            </Link>
            <Link className="button-secondary" to="/register">
              Create an account
            </Link>
          </div>
          <div className="hero-note">
            <FaRegCompass aria-hidden="true" />
            <span>Thoughtful tools for every step of your LookJobber journey</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit" />
          <div className="hero-emblem">
            <span>J</span>
          </div>
          <div className="hero-float hero-float-top">
            <FaBriefcase />
            <span>Find your fit</span>
          </div>
          <div className="hero-float hero-float-bottom">
            <FaRegFileAlt />
            <span>Make your next move</span>
          </div>
        </div>
      </div>

      <div className="hero-values" aria-label="What LookJobber helps you do">
        <span>Discover new possibilities</span>
        <span>Showcase your strengths</span>
        <span>Move forward with confidence</span>
      </div>
    </section>
  );
};

export default HeroSection;
