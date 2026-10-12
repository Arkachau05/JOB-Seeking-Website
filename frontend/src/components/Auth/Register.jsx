import { useContext, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";
import { FaPencilAlt } from "react-icons/fa";
import { FaPhoneFlip } from "react-icons/fa6";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { apiUrl } from "../../lib/api";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { isAuthorized, setIsAuthorized } = useContext(Context);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        apiUrl("/user/register"),
        { name, phone, email, role, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("");
      setIsAuthorized(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to create your account. Please try again."
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
            <h3>Start your next chapter</h3>
          </div>
          <form onSubmit={handleRegister}>
            <div className="inputTag">
              <label htmlFor="register-role">I am joining as</label>
              <div>
                <select
                  id="register-role"
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
              <label htmlFor="register-name">Full name</label>
              <div>
                <input
                  id="register-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
                <FaPencilAlt />
              </div>
            </div>
            <div className="inputTag">
              <label htmlFor="register-email">Email address</label>
              <div>
                <input
                  id="register-email"
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
              <label htmlFor="register-phone">Phone number</label>
              <div>
                <input
                  id="register-phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
                <FaPhoneFlip />
              </div>
            </div>
            <div className="inputTag">
              <label htmlFor="register-password">Password</label>
              <div>
                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <RiLock2Fill />
              </div>
            </div>
            <button type="submit">
              Register
            </button>
            <Link to="/login">Already have an account? Log in</Link>
          </form>
        </div>
        <div className="banner">
          <div className="banner-copy">
            <p>A good place to begin</p>
            <h2>Make room for what’s next.</h2>
          </div>
        </div>
      </section>
    </>
  );
};

export default Register;
