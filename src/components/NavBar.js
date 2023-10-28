import React from 'react';
import Link from 'next/link'; // Import Link from next/link

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="logo">App Name</div>
      <ul className="nav-links">
        <Link href = "/">
          <li>Home</li>
        </Link>
        <Link href = "/news">
          <li>Queries</li>
        </Link>
        <li>Blogs</li>
        <li>FAQs</li>
        <Link href = "/aboutUs">
          <li className = "about-us">About Us</li>
        </Link>
        <Link href = "/contact">
          <li className = "contact">Contact</li>
        </Link>
        {/* Add other navigation items */}
      </ul>
      <Link href="/auth/login" passHref> {/* Add Link component with href prop */}
        <button className="get-started">Get Started</button>
      </Link> {/* Close Link component */}
    </nav>
  );
};

export default NavBar;
