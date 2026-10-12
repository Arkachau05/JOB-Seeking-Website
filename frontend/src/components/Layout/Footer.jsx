import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} LookJobber. Building your future.</span>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link to="/job/getall">Explore jobs</Link>
        {!isAuthPage && <Link to="/register">Create an account</Link>}
        <a
          href="https://www.linkedin.com/in/arkadyuti-chaudhuri/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn profile"
        >
          <FaLinkedinIn aria-hidden="true" />
        </a>
        <a
          href="https://github.com/Arkachau05"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub profile"
        >
          <FaGithub aria-hidden="true" />
        </a>
      </nav>
    </footer>
  );
};

export default Footer;
