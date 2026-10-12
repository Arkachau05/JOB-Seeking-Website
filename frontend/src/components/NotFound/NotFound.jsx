import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="page notfound">
      <span className="section-kicker">404 — Page not found</span>
      <h1>This page took a different turn.</h1>
      <p className="page-intro">
        The link may be outdated, or the page may have moved.
      </p>
      <div className="center">
        <Link className="button-35" to="/">
          Return to LookJobber
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
