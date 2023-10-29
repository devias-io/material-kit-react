import React, { useState, useEffect } from 'react';
import { getLatestNews } from '../services/bingNewsAPI';
import NavBar from './NavBar';

function BingNewsList() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('stock'); // default query

  // 修改 fetchData 函数，使用 await 调用 getLatestNews
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getLatestNews(query);
      if (data && data.value) {
        setNews(data.value);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="navbar-fixed">
      <NavBar />
    </div>
    <section style={{
        backgroundColor: '#DEE7ED',
        padding: '200px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 'auto',
      }}>
      <h1>Latest News</h1>
      <div>
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for news..."
          sx={{
            bgcolor: 'secondary.main',
            borderRadius: 4,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#000000',
              },
              '&:hover fieldset': {
                borderColor: '#000000',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#000000',
              },
            },
          }}
        />
        <button onClick={fetchData}>Search</button>
      </div>
    </section>
      {loading && <div>Loading...</div>}
      {!loading && (
        <ul style={{ listStyle: 'none' }}>
          {news.map((item, index) => (
            <li key={index}
            style={{ backgroundColor: '#FCF8FC' }}>
              <h2 style={{ fontSize: '30px'}}><a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'black' }}>{item.name}</a></h2>
              <p><strong>Creators:</strong> {item.creator && item.creator.join(', ')}</p>
              {item.description && <p><strong>Description:</strong> {item.description}</p>}
              {item.content && <p><strong>Content:</strong> {item.content}</p>}
              <p><strong>Publication Date:</strong> {new Date(item.datePublished).toLocaleString('en-US')}</p>
              <p><strong>Keywords:</strong> {item.keywords || "N/A"}</p>
              <p><strong>Image URL:</strong> {item.image && item.image.thumbnail && item.image.thumbnail.contentUrl || 'N/A'}</p>
              <p><strong>Category:</strong> {item.category && item.category.join(', ')}</p>
              <p><strong>Country:</strong> {item.country && item.country.join(', ')}</p>
              <p><strong>Language:</strong> {item.language}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BingNewsList;
