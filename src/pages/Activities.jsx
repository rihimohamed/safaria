import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Star, Clock, Activity as ActivityIcon } from 'lucide-react';
import Card from '../components/Card';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import './Activities.css';

export default function Activities() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initQuery = searchParams.get('search') || '';
  const cityQuery = searchParams.get('city') || '';

  const [activeFilter, setActiveFilter] = useState('All');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initQuery);
  const [activeCity, setActiveCity] = useState(cityQuery);
  const { isSaved, savePlace, removePlace } = useSavedPlaces();

  const filters = ['All', 'Cultural', 'Nature', 'Historic', 'Architecture'];

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const clientId = import.meta.env.VITE_FOURSQUARE_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_FOURSQUARE_CLIENT_SECRET;
        const limit = 50; // Use all available places in the API (Foursquare search scales better)
        
        const targetLocation = activeCity ? `${activeCity}, Morocco` : 'Morocco';
        const url = `https://api.foursquare.com/v2/venues/explore?near=${encodeURIComponent(targetLocation)}&section=outdoors&limit=${limit}&venuePhotos=1&client_id=${clientId}&client_secret=${clientSecret}&v=20231010`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.response && data.response.groups && data.response.groups.length > 0) {
            const fetchWikipediaImage = async (name) => {
                try {
                    const u = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name.split(' ')[0])}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
                    const r = await fetch(u);
                    const j = await r.json();
                    const pages = j.query.pages;
                    const pageId = Object.keys(pages)[0];
                    if (pageId !== "-1" && pages[pageId].thumbnail) {
                        return pages[pageId].thumbnail.source;
                    }
                } catch(e) {
                    console.error("Wikipedia fetch failed:", e);
                }
                return null;
            };

            const items = data.response.groups[0].items;
            const mapped = await Promise.all(items.map(async (item, i) => {
                const venue = item.venue;
                let categoryName = venue.categories.length > 0 ? venue.categories[0].name : 'Cultural';
                
                let type = 'Cultural';
                if (categoryName.includes('Park') || categoryName.includes('Beach') || categoryName.includes('Mountain') || categoryName.includes('Camp')) type = 'Nature';
                else if (categoryName.includes('Museum') || categoryName.includes('Historic') || categoryName.includes('Ruins')) type = 'Historic';
                else if (categoryName.includes('Mosque') || categoryName.includes('Palace')) type = 'Architecture';

                let imageUrl = null;
                try {
                    const venuePhoto = venue.photos?.groups?.[0]?.items?.[0];
                    if (venuePhoto) {
                        let suffix = venuePhoto.suffix;
                        if (!suffix.startsWith('/')) suffix = '/' + suffix;
                        imageUrl = `${venuePhoto.prefix}original${suffix}`;
                    }
                } catch(e) {}

                if (!imageUrl) {
                    imageUrl = await fetchWikipediaImage(venue.name);
                }

                if (!imageUrl) {
                    const seed = (venue.id ? venue.id.charCodeAt(0) + venue.id.charCodeAt(venue.id.length-1) : i) % 10000;
                    const cleanCat = categoryName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
                    imageUrl = `https://loremflickr.com/800/600/morocco,${cleanCat}?lock=${seed}`;
                }

                return {
                    id: venue.id,
                    name: venue.name,
                    image: imageUrl,
                    city: venue.location.city || venue.location.state || 'Morocco',
                    rating: (Math.random() * 0.8 + 4.2).toFixed(1),
                    duration: `${Math.floor(Math.random() * 3) + 1} hours`,
                    type: type,
                    aiRecommended: i < 3
                };
            }));
            setActivities(mapped);
        }
      } catch (error) {
        console.error("Foursquare Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [activeCity]);

  return (
    <div className="activities-container page-content glass min-h-screen pb-32 md:pb-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 animate-fade-in-up pt-4 md:pt-0">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tighter mb-2 leading-tight">
            {activeCity ? `Activities in ${activeCity}` : 'Local Activities'}
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg font-medium leading-relaxed">
            Discover historic sites, cultural landmarks, and hidden gems.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Search activities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface text-base"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary/30 transition-all shadow-sm">
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="filter-pills flex gap-3 overflow-x-auto pb-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {filters.map(f => (
          <button 
            key={f} 
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 border ${
               activeFilter === f 
               ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]' 
               : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low'
            }`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 bg-surface-container-lowest/50 rounded-[2rem] border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center">
             <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
             <p className="text-on-surface-variant font-medium">Discovering amazing activities...</p>
          </div>
        ) : activities.length > 0 ? (
          activities.filter(a => {
            const matchesCategory = activeFilter === 'All' || a.type === activeFilter;
            const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  a.city.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
          }).map(act => (
            <Card key={act.id} hoverable className="p-0 overflow-hidden flex flex-col group relative bg-surface-container-lowest border-0 shadow-[0_12px_32px_rgba(25,28,28,0.06)] rounded-[2rem]">
              <div className="relative h-48 w-full overflow-hidden shrink-0">
                <img src={act.image} alt={act.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/10 to-transparent"></div>
                
                {act.aiRecommended && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-amber-600 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 shadow-sm">
                    <Star size={12} fill="currentColor" /> AI Top Pick
                  </div>
                )}
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    isSaved(act.name) 
                      ? removePlace(act.name) 
                      : savePlace({ id: act.name, name: act.name, category: act.type, city: act.city, type: 'poi', description: `Recommended duration: ${act.duration}` });
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 hover:bg-black/60 transition-all z-20 shadow-sm"
                  title={isSaved(act.name) ? "Remove from saved" : "Save this activity"}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: isSaved(act.name) ? "'FILL' 1" : "'FILL' 0", color: isSaved(act.name) ? '#ef4444' : 'white'}}>bookmark</span>
                </button>
                
                <div className="absolute bottom-4 left-5 text-white pr-4">
                   <h3 className="text-2xl font-extrabold font-headline tracking-tighter text-white mb-1 drop-shadow-md leading-tight">{act.name}</h3>
                </div>
              </div>
              
              <div className="p-5 bg-surface-container-lowest flex flex-col grow">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest bg-surface-container px-2.5 py-1 rounded-md">{act.type}</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-on-surface">
                     <Star size={14} className="text-amber-500 mb-0.5" fill="currentColor" /> {act.rating}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium mt-auto">
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary/70" /> {act.duration}</span>
                  <span className="flex items-center gap-1.5"><ActivityIcon size={14} className="text-primary/70" /> {act.city}</span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-surface-container-lowest/50 rounded-[2rem] border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center">
             <span className="material-symbols-outlined text-stone-300 text-6xl mb-4">search_off</span>
             <h3 className="text-xl font-bold text-on-surface mb-2">No activities found</h3>
             <p className="text-on-surface-variant">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
