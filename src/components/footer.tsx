"use client";
import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] py-6 px-6 text-white text-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 text-center md:text-left">
        {/* Left Section */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
          <Link href="#" className="hover:text-white/70">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-white/70">
            Terms of Use
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex flex-col items-center md:items-end space-y-4">
          {/* Contact & Socials */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <p className="text-white/60 text-center md:text-left">
              Contact us:{" "}
              <Link
                href="mailto:info@reviai.com"
                className="text-white  hover:text-white/80"
              >
                info@reviai.ai
              </Link>
            </p>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <p>Follow Us</p>
              <div className="flex space-x-3">
                <Link href="https://www.tiktok.com/@reviai_technologies?_r=1&_d=egfi6lbc7ek567&sec_uid=MS4wLjABAAAAKHemDW7bA0aOxDGW3WcX2Kc9tnPIC7Ec_kcQKQGRCi4Kwtc9uB1bMPRYwURSbW1k&share_author_id=7200722159294137349&sharer_language=en&source=h5_m&u_code=e6d842d7i52afm&timestamp=1755889478&user_id=7200722159294137349&sec_user_id=MS4wLjABAAAAKHemDW7bA0aOxDGW3WcX2Kc9tnPIC7Ec_kcQKQGRCi4Kwtc9uB1bMPRYwURSbW1k&utm_source=copy&utm_campaign=client_share&utm_medium=android&share_iid=7422194374261802758&share_link_id=ae518f54-a01a-4387-9e62-774f84100821&share_app_id=1233&ugbiz_name=ACCOUNT&ug_btm=b8727%2Cb0229&social_share_type=5&enable_checksum=1 " className="hover:text-white/70"
                  target="_blank"
                  rel="noopener noreferrer">
                  <FaTiktok />
                </Link>
                <Link href="https://x.com/ReviTechnology?t=xjr3NRCFpuuiavLo_QO60Q&s=09
" className="hover:text-white/70"
                  target="_blank"
                  rel="noopener noreferrer">

                  <FaTwitter />
                </Link>
                {/* <Link href="#" className="hover:text-white/70">
                  <FaLinkedinIn />
                </Link> */}
                <Link href="https://www.instagram.com/reviai_technologies?igsh=cWh5bzYzNWV6ZTU=
" className="hover:text-white/70"
                  target="_blank"
                  rel="noopener noreferrer">
                  <FaInstagram />
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-white/60">&copy; 2025 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
