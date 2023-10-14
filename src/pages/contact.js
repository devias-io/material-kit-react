import React, { useState } from 'react';
import NavBar from '/src/components/NavBar';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div>
      <div className="navbar-fixed">
        <NavBar />
      </div>

      <section style={{
        backgroundColor: '#FCF8FC',
        padding: '200px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 'auto',
      }}>
        <h1 style={{ marginTop: '100px' }}>How can we help you?</h1>
        <p>Have a questions? <br/> Just get in touch!</p>
      </section>

      <section style={{ 
        backgroundColor: '#FCFCFC', 
        padding: '20px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 'auto',
        display: 'flex'
        }}>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name"></label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={formData.name ? '' : 'Name*'}
              value={formData.name}
              onChange={handleChange}
              required
            />
            
            <label htmlFor="email"></label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={formData.name ? '' : 'Contact Email*'}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="title">TITLE FOR YOUR EMAIL*</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder={formData.name ? '' : 'TITLE FOR YOUR EMAIL*'}
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="message">DESCRIPT YOUR QUESTION:</label>
            <textarea
              id="message"
              name="message"
              placeholder={formData.name ? '' : 'TEXT'}
              value={formData.message}
              onChange={handleChange}
              rows="4"
              maxLength="1000"
            ></textarea>
          </div>
          <div>
            <button style={{ marginTop: '100px' }} type="submit" className="button">
              Send <span>&#10140;</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Contact;
