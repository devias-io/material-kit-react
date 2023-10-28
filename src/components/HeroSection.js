import Link from 'next/link';

// HeroSection.js
const HeroSection = () => {
    return (
        <div>
        <section className="section1">
            <div className="text-section"> 
                <h1>Investing on Fintech80</h1>
                <p>Start investing with Fintech80 with AI...</p>
                <button>Get Started</button>
            </div>
            <img src="/investment-money.gif" alt="Descriptive alt text" className="herosection-gif"/>
        </section>
        <section className="section2">
            <img src="/images/wsHome.gif" alt="Descriptive alt text" className="herosection-gif"/>
            <div className="text-section">
                
                <h1>Investing on Fintech80 section 2</h1>
                <p>Start investing with Fintech80 with AI...and something more</p>
                <Link href="/learnMore">
                    <button>Learn More</button>
                </Link>
            </div>
        </section>
        </div>
    );
};

export default HeroSection;
