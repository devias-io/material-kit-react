import React from 'react';
import NavBar from '/src/components/NavBar';

const teamMembers = [
  {
    id: 1,
    name: 'John Doe',
    position: 'CEO',
    introduction: 'John Doe is the CEO of our company...',
    imageSrc: '/images/cat.jpg', // 请提供成员的头像图片路径
  },
  {
    id: 2,
    name: 'Jane Smith',
    position: 'CTO',
    introduction: 'Jane Smith is the Chief Technology Officer...',
    imageSrc: '/images/cat.jpg',
  },
  {
    id: 3,
    name: 'Jane Smith',
    position: 'CTO',
    introduction: 'Jane Smith is the Chief Technology Officer...',
    imageSrc: '/images/cat.jpg',
  },
  {
    id: 4,
    name: 'Jane Smith',
    position: 'CTO',
    introduction: 'Jane Smith is the Chief Technology Officer...',
    imageSrc: '/images/cat.jpg',
  },
  {
    id: 5,
    name: 'Jane Smith',
    position: 'CTO',
    introduction: 'Jane Smith is the Chief Technology Officer...',
    imageSrc: '/images/cat.jpg',
  },
  {
    id: 6,
    name: 'Jane Smith',
    position: 'CTO',
    introduction: 'Jane Smith is the Chief Technology Officer...',
    imageSrc: '/images/cat.jpg',
  },
  {
    id: 7,
    name: 'Jane Smith',
    position: 'CTO',
    introduction: 'Jane Smith is the Chief Technology Officer...',
    imageSrc: '/images/cat.jpg',
  },
  {
    id: 8,
    name: 'Waiting for you to join us',
    position: '',
    introduction: '',
    imageSrc: '/images/white.png',
  },
];

const AboutUs = () => {
    return (
      <div>
        <div className="navbar-fixed">
        <NavBar />
        </div>
        <div className="team-container">
        <div className="header">
          <img
            src="/images/Teamwork.jpg"
            alt="Main Image"
            className="main-image"
          />
          <h1 class="h1-about-us">Who are we?</h1>
          <p class="p-about-us">Description of team</p>
        </div>
        <div className="team-members">
        {teamMembers.map((member) => (
          <div className="member-card" key={member.id}>
            <img
              src={member.imageSrc}
              alt={`${member.name}'s Photo`}
              className="member-image"
            />
            <div className="member-name">{member.name}</div>
            <div className="member-position">{member.position}</div>
            <div className="member-introduction">{member.introduction}</div>
          </div>
        ))}
      </div>
      </div>
        </div>
    );
  }
  
  export default AboutUs;