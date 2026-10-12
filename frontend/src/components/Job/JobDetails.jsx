import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { Context } from "../../main";
import { apiUrl } from "../../lib/api";
import { findDemoJob } from "../../data/demoJobs";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    let isActive = true;
    const demoJob = findDemoJob(id);

    if (demoJob) {
      setJob(demoJob);
      setLoadError("");
      return () => {
        isActive = false;
      };
    }

    axios
      .get(apiUrl(`/job/${id}`), {
        withCredentials: true,
      })
      .then((response) => {
        if (isActive) {
          setJob(response.data.job);
        }
      })
      .catch((error) => {
        if (isActive) {
          setLoadError(
            error?.response?.data?.message || "Unable to load this job."
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  if (loadError) {
    return (
      <section className="jobDetail page">
        <div className="container">
          <p className="empty-state error-state" role="alert">
            {loadError}
          </p>
          <Link className="button-secondary" to="/job/getall">
            Back to jobs
          </Link>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="jobDetail page">
        <div className="container">
          <p className="empty-state" role="status">
            Loading job details...
          </p>
        </div>
      </section>
    );
  }

  const location =
    job.location || [job.city, job.country].filter(Boolean).join(", ");
  const canApply = user?.role !== "Employer";

  return (
    <main className="jobDetail page">
      <div className="container">
        <span className="section-kicker">Opportunity details</span>
        <h1>{job.title}</h1>
        <article className="banner">
          {job.isDemo && (
            <p className="demo-notice">
              This is a sample listing for preview only. Replace it with your
              own job data to accept applications.
            </p>
          )}
          <p>
            Category: <span>{job.category}</span>
          </p>
          <p>
            Location: <span>{location || "Location not specified"}</span>
          </p>
          <p>
            Description: <span>{job.description}</span>
          </p>
          <p>
            Posted on:{" "}
            <span>
              {job.jobPostedOn
                ? new Date(job.jobPostedOn).toLocaleDateString()
                : "Date not available"}
            </span>
          </p>
          <p>
            Salary:{" "}
            <span>
              {job.fixedSalary ||
                (job.salaryFrom && job.salaryTo
                  ? `${job.salaryFrom} - ${job.salaryTo}`
                  : "Not specified")}
            </span>
          </p>
          {job.isDemo ? (
            <Link className="button-secondary" to="/job/getall">
              Back to sample jobs
            </Link>
          ) : canApply &&
            (isAuthorized ? (
              <Link to={`/application/${job._id}`}>Apply for this role</Link>
            ) : (
              <Link to="/login">Log in to apply</Link>
            ))}
        </article>
      </div>
    </main>
  );
};

export default JobDetails;
