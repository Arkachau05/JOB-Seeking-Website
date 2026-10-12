import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { demoJobs } from "../../data/demoJobs";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isShowingDemoJobs, setIsShowingDemoJobs] = useState(false);

  useEffect(() => {
    let isActive = true;

    axios
      .get(apiUrl("/job/getall"), {
        withCredentials: true,
      })
      .then((response) => {
        if (isActive) {
          const liveJobs = response.data.jobs || [];
          setJobs(liveJobs.length > 0 ? liveJobs : demoJobs);
          setIsShowingDemoJobs(liveJobs.length === 0);
        }
      })
      .catch((error) => {
        if (isActive) {
          setJobs(demoJobs);
          setIsShowingDemoJobs(true);
          setLoadError(
            error?.response?.data?.message ||
              "Showing sample listings because the jobs service is unavailable."
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section className="jobs page">
      <div className="container">
        <span className="section-kicker">Find your next opportunity</span>
        <h1>Open roles, new possibilities.</h1>
        <p className="page-intro">
          Explore opportunities and find a role that fits your next chapter.
        </p>
        {isShowingDemoJobs && !isLoading && (
          <p className="demo-notice" role="status">
            {loadError ||
              "These five sample opportunities are placeholders. Add your own job data when you’re ready."}
          </p>
        )}
        {isLoading ? (
          <p className="empty-state" role="status">
            Loading opportunities...
          </p>
        ) : jobs.length === 0 ? (
          <p className="empty-state">
            No open roles are available right now. Please check back soon.
          </p>
        ) : (
          <div className="banner">
            {jobs.map((job) => (
              <article className="card" key={job._id}>
                {job.isDemo && <span className="demo-badge">Sample listing</span>}
                <p>{job.title}</p>
                <p>{job.category}</p>
                <p>
                  {job.location ||
                    [job.city, job.country].filter(Boolean).join(", ") ||
                    "Location not specified"}
                </p>
                <Link to={`/job/${job._id}`}>View opportunity</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Jobs;
