import React, { useState } from 'react';
import NavBar from '/src/components/NavBar';
import Link from 'next/link';

const learnMore = () => {
  return (
    <div>
      <div className="navbar-fixed">
        <NavBar />
      </div>
      <section className="section1">
        <div className="text-section">
            
            <h1>Protect your money in this way</h1>
            <p>Start investing with Fintech80 with AI...and something more</p>
            <Link href="/learnMore">
                <button>Learn More</button>
            </Link>
        </div>
        <img src="/images/wsHome.gif" alt="Descriptive alt text" className="herosection-gif"/>
      </section>
      <section style={{
        backgroundColor: '#FCF8FC',
        padding: '200px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 'auto',
      }}>
        <h1 style={{ marginTop: '100px' }}>Everything is about coding</h1>
        <p>Why we need this fantastic app</p>
      </section>
      <section className="section2">
        <img src="/images/wsHome.gif" alt="Descriptive alt text" className="herosection-gif"/>
        <div className="text-section">
            
            <h1>Bad thing happend if...</h1>
            <p>Start investing with Fintech80 with AI...and something more</p>
            <Link href="/learnMore">
                <button>Learn More</button>
            </Link>
        </div>
      </section>
    </div>
  );
};

export default learnMore;