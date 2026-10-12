import { FaUserPlus } from "react-icons/fa";
import { MdFindInPage } from "react-icons/md";
import { IoMdSend } from "react-icons/io";

const HowItWorks = () => {
  return (
      <section className="howitworks" aria-labelledby="how-it-works-title">
        <div className="container">
          <h3 id="how-it-works-title">A clearer path to what’s next</h3>
          <div className="banner">
            <article className="card">
              <FaUserPlus aria-hidden="true" />
              <p>Build your profile</p>
              <p>Share what you do well and the kind of opportunity you want.</p>
            </article>
            <article className="card">
              <MdFindInPage aria-hidden="true" />
              <p>Explore your options</p>
              <p>Browse roles and discover teams looking for your strengths.</p>
            </article>
            <article className="card">
              <IoMdSend aria-hidden="true" />
              <p>Take the next step</p>
              <p>Apply with confidence and keep your career moving forward.</p>
            </article>
          </div>
        </div>
      </section>
  );
};

export default HowItWorks;
