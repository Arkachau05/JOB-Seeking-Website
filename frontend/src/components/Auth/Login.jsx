import { useContext, useState } from "react";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { Navigate } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { apiUrl } from "../../lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { isAuthorized, setIsAuthorized } = useContext(Context);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        apiUrl("/user/login"),
        { email, password, role },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setEmail("");
      setPassword("");
      setRole("");
      setIsAuthorized(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to log in. Please try again."
      );
    }
  };

  if(isAuthorized){
    return <Navigate to={'/'}/>
  }

  return (
    <>
      <section className="authPage">
        <div className="container">
          <div className="header">
            <h3>Welcome back</h3>
          </div>
          <form onSubmit={handleLogin}>
            <div className="inputTag">
              <label htmlFor="login-role">Login as</label>
              <div>
                <select
                  id="login-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Employer">Employer</option>
                  <option value="Job Seeker">Job Seeker</option>
                </select>
                <FaRegUser />
              </div>
            </div>
            <div className="inputTag">
              <label htmlFor="login-email">Email address</label>
              <div>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <MdOutlineMailOutline />
              </div>
            </div>
            <div className="inputTag">
              <label htmlFor="login-password">Password</label>
              <div>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <RiLock2Fill />
              </div>
            </div>
            <button type="submit">
              Login
            </button>
          </form>
        </div>
        <div className="banner">
          <div className="banner-copy">
            <p>Your next chapter</p>
            <h2>Good to have you back.</h2>
          </div>
        </div>
      </section>
    </>
  );
};

export default Login;
