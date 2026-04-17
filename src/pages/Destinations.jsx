import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin } from 'lucide-react';
import Card from '../components/Card';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import './Destinations.css';

const DestinationCard = ({ dest }) => {
  const [imageUrl, setImageUrl] = useState(dest.fallbackImage);
  const navigate = useNavigate();
  const { isSaved, savePlace, removePlace } = useSavedPlaces();

    useEffect(() => {
    let isMounted = true;
    const fetchWikipediaImage = async () => {
      try {
        const search = encodeURIComponent(dest.cityName);
        const u = `https://en.wikipedia.org/w/api.php?action=query&titles=${search}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
        const r = await fetch(u);
        const j = await r.json();
        const pages = j.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1" && pages[pageId].thumbnail && isMounted) {
            setImageUrl(pages[pageId].thumbnail.source);
        } else if (isMounted) {
            setImageUrl(`https://loremflickr.com/800/600/morocco,${search}?lock=${dest.id}`);
        }
      } catch(e) {
          if (isMounted) setImageUrl(`https://loremflickr.com/800/600/morocco,${encodeURIComponent(dest.cityName)}?lock=${dest.id}`);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchWikipediaImage();
    }, Math.random() * 800);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [dest.cityName, dest.id]);

  return (
    <Card hoverable className="destination-card" onClick={() => navigate(`/activities?city=${encodeURIComponent(dest.cityName)}`)}>
      <div className="dest-image-wrapper">
        <img src={imageUrl} alt={dest.name} className="dest-image" loading="lazy" />
        {dest.aiRecommended && (
          <div className="ai-badge">
            <Star size={12} fill="currentColor" /> AI Top Pick
          </div>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            isSaved(dest.cityName) 
              ? removePlace(dest.cityName) 
              : savePlace({ id: dest.cityName, name: dest.cityName, category: 'City', city: dest.cityName, description: `Climate: ${dest.climate}, Budget: ${dest.price}` });
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 hover:bg-black/60 transition-all z-20"
          title={isSaved(dest.cityName) ? "Remove from saved" : "Save this place"}
        >
          <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: isSaved(dest.cityName) ? "'FILL' 1" : "'FILL' 0", color: isSaved(dest.cityName) ? '#ef4444' : 'white'}}>bookmark</span>
        </button>
      </div>
      <div className="dest-info">
        <div className="dest-title-row">
          <h3 className="dest-name">{dest.name}</h3>
          <span className="dest-rating"><Star size={14} className="star-icon" fill="currentColor" /> {dest.rating}</span>
        </div>
        <div className="dest-details-row">
          <span className="dest-location"><MapPin size={14} /> View Map</span>
          <span className="dest-price">{dest.price}</span>
        </div>
      </div>
    </Card>
  );
};

export default function Destinations() {
  const location = useLocation();
  const initQuery = new URLSearchParams(location.search).get('search') || '';

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initQuery);
  const [destinations, setDestinations] = useState([]);
  const [visibleCount, setVisibleCount] = useState(100); // Display all cities by default

    useEffect(() => {
        let isMounted = true;
        const fetchCities = async () => {
            try {
                const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: "Morocco" })
                });
                const data = await res.json();
                
                if (data && !data.error && data.data && isMounted) {
                    const mapped = data.data.map((city, index) => {
                        let climate = 'Sunny';
                        if (['Ifrane', 'Azrou', 'Midelt', 'Azilal', 'Khenifra'].includes(city)) climate = 'Cold';
                        else if (['Agadir', 'Dakhla', 'Essaouira', 'Taghazout'].includes(city)) climate = 'Tropical';
                        else if (['Tangier', 'Tetouan', 'Rabat', 'Casablanca', 'Kenitra'].includes(city)) climate = 'Mild';
                        else climate = 'Sunny';

      const price = index % 5 === 0 ? "$$$" : index % 2 === 0 ? "$$" : "$";

                        return {
                            id: index,
                            cityName: city,
                            name: city + ", Morocco",
                            fallbackImage: `https://loremflickr.com/800/600/morocco,${encodeURIComponent(city.split(' ')[0])}?lock=${index}`,
                            rating: (Math.random() * 0.8 + 4.2).toFixed(1),
                            price,
                            climate,
                            aiRecommended: index < 6
                        };
                    });
                    setDestinations(mapped);
                }
            } catch (error) {
                console.error("Cities fetch failed", error);
            }
        };
        fetchCities();
        
        return () => { isMounted = false; };
    }, []);

  const filters = ['All', 'Sunny', 'Cold', 'Tropical', 'Mild'];

  const filteredDestinations = destinations.filter(d => {
    const matchesCategory = activeFilter === 'All' || d.climate === activeFilter;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="destinations-container page-content glass">
      <div className="destinations-header">
        <h2>Explore Destinations</h2>
        <div className="destinations-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-btn glass">
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      <div className="filter-pills">
        {filters.map(f => (
          <button
            key={f}
            className={`pill ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="destinations-grid">
        {filteredDestinations.slice(0, visibleCount).map(dest => (
          <DestinationCard key={dest.id} dest={dest} />
        ))}
      </div>

      {visibleCount < filteredDestinations.length && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="bg-surface-container-high hover:bg-surface-container-highest text-stone-600 px-8 py-3 rounded-full font-bold text-sm transition-all active:scale-95 shadow-sm border border-outline-variant/20"
          >
            Load More Places
          </button>
        </div>
      )}
    </div>
  );
}