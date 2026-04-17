import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [activeDashboardCategory, setActiveDashboardCategory] = useState('All');
  const [dashboardActivities, setDashboardActivities] = useState([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const clientId = import.meta.env.VITE_FOURSQUARE_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_FOURSQUARE_CLIENT_SECRET;
        const response = await fetch(`https://api.foursquare.com/v2/venues/explore?near=Morocco&limit=10&venuePhotos=1&client_id=${clientId}&client_secret=${clientSecret}&v=20231010`);
        const data = await response.json();
        
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
                } catch(e) {}
                return null;
            };

            const items = data.response.groups[0].items;
            const mappedPlaces = await Promise.all(items.map(async (item, index) => {
                const venue = item.venue;
                const category = venue.categories.length > 0 ? venue.categories[0].name : 'Place';
                
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
                    const seed = (venue.id ? venue.id.charCodeAt(0) + venue.id.charCodeAt(venue.id.length-1) : index) % 10000;
                    const cleanCat = category.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
                    imageUrl = `https://loremflickr.com/800/600/morocco,${cleanCat}?lock=${seed}`;
                }
                
                return {
                    id: venue.id,
                    name: venue.name,
                    imageUrl,
                    category,
                    city: venue.location.city || venue.location.state || 'Morocco',
                    description: `Recommended ${category.toLowerCase()} in ${venue.location.city || venue.location.state || 'Morocco'}.`
                };
            }));
            // We use the first 2 for Concierge Picks, and the next dynamically for Dashboard Activities
            setDashboardActivities(mappedPlaces.slice(2));
            setPlaces(mappedPlaces.slice(0, 2));
        }

        // Fetch Real Weather Data using Visual Crossing for Morocco (Casablanca as proxy)
        try {
            const vcKey = import.meta.env.VITE_VISUAL_CROSSING_API_KEY;
            const weatherRes = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Casablanca,Morocco?unitGroup=metric&key=${vcKey}&contentType=json`);
            const weatherData = await weatherRes.json();
            setWeather(weatherData.currentConditions);
        } catch(e) { console.error("Visual Crossing fetch failed", e); }

      } catch (error) {
        console.error("Failed to fetch Foursquare venues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const getVCIcon = (iconString) => {
      if (!iconString) return { icon: 'partly_cloudy_day', desc: 'Scattered clouds' };
      const str = iconString.toLowerCase();
      if (str.includes('clear')) return { icon: 'clear_day', desc: 'Sunny' };
      if (str.includes('partly')) return { icon: 'partly_cloudy_day', desc: 'Partly Cloudy' };
      if (str.includes('fog')) return { icon: 'foggy', desc: 'Foggy' };
      if (str.includes('rain')) return { icon: 'rainy', desc: 'Rainy' };
      if (str.includes('snow')) return { icon: 'cloudy_snowing', desc: 'Snow' };
      if (str.includes('thunder')) return { icon: 'thunderstorm', desc: 'Thunderstorm' };
      if (str.includes('cloudy')) return { icon: 'cloudy', desc: 'Cloudy' };
      return { icon: 'partly_cloudy_day', desc: str };
  };
  const weatherInfo = weather ? getVCIcon(weather.icon) : { icon: 'partly_cloudy_day', desc: 'Scattered clouds' };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Hero Greeting Section */}
        <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="inline-block px-4 py-1.5 bg-tertiary-container/20 text-tertiary font-bold text-[10px] tracking-widest uppercase rounded-full mb-4">MEMBER SINCE 2022</span>
                    <h2 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-2 font-headline">Welcome back, Alex!</h2>
                    <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed">Your next adventure is waiting. AI has curated some breathtaking vistas for your upcoming September break.</p>
                </div>
                
                {/* Weather Widget */}
                <div className="bg-surface-container-low p-6 rounded-lg flex items-center gap-6 min-w-[300px]">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Current Location</span>
                        <span className="text-xl font-bold text-teal-900 font-headline">Casablanca, MA</span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <span className="material-symbols-outlined text-4xl text-tertiary">{weatherInfo.icon}</span>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-on-surface font-headline">{weather ? Math.round(weather.temp) : '21'}°C</span>
                            <span className="text-xs text-stone-500">{weatherInfo.desc}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Bento Quick Actions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="md:col-span-2 bg-primary text-white p-8 rounded-xl relative overflow-hidden group cursor-pointer shadow-lg active:scale-[0.98] transition-all">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <h3 className="text-3xl font-bold mb-2 font-headline">Plan Trip</h3>
                        <p className="text-primary-fixed/80 max-w-[200px]">Let SafarAI build your custom itinerary in seconds.</p>
                    </div>
                    <span className="material-symbols-outlined text-5xl opacity-50 self-end">auto_awesome</span>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container rounded-full -mr-10 -mt-10 blur-3xl opacity-50"></div>
            </div>
            
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group cursor-pointer hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-teal-600 mb-6 block text-3xl">explore</span>
                <h4 className="font-bold text-lg mb-1 font-headline">Explore</h4>
                <p className="text-stone-500 text-sm">Discover hidden gems and local favorites.</p>
            </div>
            
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/10 group cursor-pointer hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-tertiary mb-6 block text-3xl">bookmark</span>
                <h4 className="font-bold text-lg mb-1 font-headline">Saved</h4>
                <p className="text-stone-500 text-sm">Review your curated bucket list.</p>
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Concierge Picks */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold tracking-tight font-headline">Concierge Picks</h3>
                    <a className="text-teal-700 text-sm font-semibold hover:underline" href="#">View All Recommendations</a>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-stone-500">
                            Loading AI recommendations...
                        </div>
                    ) : places.length > 0 ? (
                        places.map((place, index) => (
                            <div key={place.id} className="group cursor-pointer">
                                <div className={`relative overflow-hidden aspect-[4/5] mb-6 shadow-xl ${index % 2 === 0 ? 'asymmetric-border' : 'rounded-xl'}`} style={index % 2 !== 0 ? { borderBottomLeftRadius: '4rem' } : {}}>
                                    <img 
                                        alt={place.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                        src={place.imageUrl}
                                    />
                                    <div className="absolute top-4 right-4 bg-tertiary-container/90 backdrop-blur text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        AI SUGGESTION
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold mb-1 font-headline">{place.name}</h4>
                                <p className="text-stone-500 text-sm italic mb-4">"{place.description}"</p>
                                <div className="flex items-center gap-4 text-xs font-bold text-teal-800 tracking-wider uppercase">
                                    <span>{place.category}</span>
                                    <span className="h-1 w-1 bg-stone-300 rounded-full"></span>
                                    <span>{place.city}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-stone-500">
                            No recommendations found.
                        </div>
                    )}
                </div>

                {/* Dashboard Activities Section */}
                <div className="flex justify-between items-center mb-8 mt-16">
                    <h3 className="text-2xl font-bold tracking-tight font-headline">Explore Activities</h3>
                    <a className="text-teal-700 text-sm font-semibold hover:underline" href="/activities">View All</a>
                </div>

                {/* Dashboard Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    {['All', 'Historic', 'Culture', 'Outdoors'].map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveDashboardCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeDashboardCategory === cat ? 'bg-teal-800 text-white' : 'bg-surface-container border border-outline-variant/20 text-stone-600 hover:bg-surface-container-highest'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-stone-500">
                            Loading AI activities...
                        </div>
                    ) : dashboardActivities && dashboardActivities.length > 0 ? (
                        dashboardActivities
                          .filter(act => activeDashboardCategory === 'All' || act.category.toLowerCase().includes(activeDashboardCategory.toLowerCase()) || act.description.toLowerCase().includes(activeDashboardCategory.toLowerCase()))
                          .slice(0, 4)
                          .map((act) => (
                            <div key={act.id} className="group cursor-pointer bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10 hover:shadow-md transition-all flex items-center gap-4">
                                <img src={act.imageUrl} alt={act.name} className="w-20 h-20 rounded-lg object-cover" />
                                <div>
                                    <h4 className="font-bold text-on-surface mb-1 leading-tight">{act.name}</h4>
                                    <p className="text-stone-500 text-xs mb-2">{act.category} • {act.city}</p>
                                    <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase">Book Now</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-stone-500">
                            No activities found.
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="lg:col-span-1">
                <div className="bg-surface-container-low p-8 rounded-lg min-h-full">
                    <h3 className="text-xl font-bold mb-8 font-headline">Recent Activity</h3>
                    <div className="relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-outline-variant/20"></div>
                        <div className="space-y-10">
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-surface-container-low bg-tertiary z-10"></div>
                                <span className="text-[10px] font-bold text-stone-400 block mb-1 uppercase tracking-widest">Today, 10:24 AM</span>
                                <p className="text-sm font-semibold text-on-surface">Saved {dashboardActivities.length > 0 ? `"${dashboardActivities[0].name}"` : '"Hotel de la Ville"'} to Morocco trip</p>
                                <p className="text-xs text-stone-500 mt-1">{dashboardActivities.length > 0 ? dashboardActivities[0].category : 'Luxury category'} recommendation.</p>
                            </div>
                            
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-surface-container-low bg-primary z-10"></div>
                                <span className="text-[10px] font-bold text-stone-400 block mb-1 uppercase tracking-widest">Yesterday</span>
                                <p className="text-sm font-semibold text-on-surface">AI generated 3-day {places.length > 0 ? places[0].city : 'Kyoto'} itinerary</p>
                                <p className="text-xs text-stone-500 mt-1">Focus on {places.length > 0 ? places[0].name : 'Gion District'} area.</p>
                            </div>
                            
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-surface-container-low bg-stone-300 z-10"></div>
                                <span className="text-[10px] font-bold text-stone-400 block mb-1 uppercase tracking-widest">Aug 24, 2026</span>
                                <p className="text-sm font-semibold text-on-surface">Booked flights to {weather ? 'Casablanca (CMN)' : 'London (LHR)'}</p>
                                <p className="text-xs text-stone-500 mt-1">Confirmation #SA-9921-X</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mini Map Preview */}
                    <div className="mt-12 rounded-xl overflow-hidden aspect-square shadow-inner bg-surface-container-high relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                            <span className="material-symbols-outlined text-6xl">map</span>
                        </div>
                        <div className="absolute inset-0 bg-teal-900/5"></div>
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-sm">pin_drop</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-stone-500 uppercase leading-none">UPCOMING DESTINATION</p>
                                <p className="text-sm font-bold text-on-surface">{places.length > 0 ? `${places[0].name}, ${places[0].city}` : 'Positano, Italy'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
