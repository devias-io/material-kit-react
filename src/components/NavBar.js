import React from 'react';

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="logo">Logo</div>
      <ul className="nav-links">
        <li>Invest</li>
        <li>Save</li>
        <li>Retire</li>
        {/* Add other navigation items */}
      </ul>
      <button className="get-started">Get Started</button>
    </nav>
  );
};

export default NavBar;
