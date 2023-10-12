import React from 'react';
import Link from 'next/link'; // Import Link from next/link

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="logo">App Name</div>
      <ul className="nav-links">
        <li>Home</li>
        <li>Queries</li>
        <li>Blogs</li>
        <li>FAQs</li>
        <li>About us</li>
        <li>Contact</li>
        {/* Add other navigation items */}
      </ul>
      <Link href="../pages/auth/login" passHref> {/* Add Link component with href prop */}
        <button className="get-started">Get Started</button>
      </Link> {/* Close Link component */}
    </nav>
  );
};

export default NavBar;
