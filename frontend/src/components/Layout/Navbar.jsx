import { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMenu, FiX } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import { apiUrl } from "../../lib/api";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const closeMenu = () => setShow(false);

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        apiUrl("/user/logout"),
        { withCredentials: true }
      );
      toast.success(response.data.message);
      setIsAuthorized(false);
      closeMenu();
      navigateTo("/login");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to log out. Please try again."
      );
      setIsAuthorized(true);
    }
  };

  const isEmployer = user?.role === "Employer";

  return (
    <header className="site-nav">
      <nav className="nav-container" aria-label="Main navigation">
        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="LookJobber home"
        >
          <img
            className="brand-logo"
            src="/logo.png"
            alt="LookJobber — Building your Future"
          />
        </Link>

        <ul className={`nav-links${show ? " is-open" : ""}`} id="primary-navigation">
          <li>
            <Link
              to="/"
              onClick={closeMenu}
              aria-current={location.pathname === "/" ? "page" : undefined}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/job/getall"
              onClick={closeMenu}
              aria-current={
                location.pathname === "/job/getall" ? "page" : undefined
              }
            >
              Explore jobs
            </Link>
          </li>
          {isAuthorized && (
            <li>
              <Link to="/applications/me" onClick={closeMenu}>
                {isEmployer ? "Applicants" : "My applications"}
              </Link>
            </li>
          )}
          {isAuthorized && isEmployer && (
            <>
              <li>
                <Link to="/job/post" onClick={closeMenu}>
                  Post a job
                </Link>
              </li>
              <li>
                <Link to="/job/me" onClick={closeMenu}>
                  Your jobs
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="nav-actions">
          {isAuthorized ? (
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <>
              <Link className="nav-login" to="/login" onClick={closeMenu}>
                Log in
              </Link>
              {!isAuthPage && (
                <Link className="nav-register" to="/register" onClick={closeMenu}>
                  Get started
                </Link>
              )}
            </>
          )}
        </div>

        <button
          className="nav-menu-toggle"
          type="button"
          aria-label={show ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={show}
          aria-controls="primary-navigation"
          onClick={() => setShow((isOpen) => !isOpen)}
        >
          {show ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
