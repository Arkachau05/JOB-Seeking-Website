import React, { useContext } from "react";
import { Context } from "../../main";
import { Link } from "react-router-dom";
import { FaFacebookF, FaYoutube, FaLinkedin, FaGithub } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";

const Footer = () => {
  const { isAuthorized } = useContext(Context);
  return (
    <footer className={isAuthorized ? "footerShow" : "footerHide"}>
      <div>&copy; All Rights Reserved By Arkadyuti Chaudhuri.</div>
      <div>
        <Link to={"#"} target="_blank">
          <FaFacebookF />
        </Link>
        <Link to={"#"} target="_blank">
          <FaYoutube />
        </Link>
        <Link to={"https://www.linkedin.com/in/arkadyuti-chaudhuri/"} target="_blank">
          <FaLinkedin />
        </Link>
        <Link to={"https://github.com/Arkachau05"} target="_blank">
          <FaGithub />
        </Link>
  
      </div>
    </footer>
  );
};

export default Footer;
