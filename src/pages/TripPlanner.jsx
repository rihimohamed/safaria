import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Compass, Loader2, BookOpen, Info, Search, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import { generateRoadtripItinerary, generateCityExplorer } from '../services/gemini';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TripPlanner.css';

// ─── Map Icons ─────────────────────────────────────────────────────────
const customIcon = new L.Icon({
   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
   iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const activeIcon = new L.Icon({
   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
   iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
   iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Category-specific marker colors for city explorer
const CATEGORY_COLORS = {
   landmark: { color: 'gold', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'castle' },
   food: { color: 'red', bg: 'bg-red-100', text: 'text-red-700', icon: 'restaurant' },
   market: { color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', icon: 'storefront' },
   culture: { color: 'violet', bg: 'bg-purple-100', text: 'text-purple-700', icon: 'museum' },
   nature: { color: 'green', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'park' },
   nightlife: { color: 'blue', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'nightlife' },
   shopping: { color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'shopping_bag' },
   religion: { color: 'grey', bg: 'bg-stone-100', text: 'text-stone-700', icon: 'mosque' },
};

const categoryIconCache = {};
const getCategoryIcon = (category) => {
   const c = category?.toLowerCase() || 'landmark';
   const color = CATEGORY_COLORS[c]?.color || 'blue';
   if (categoryIconCache[color]) return categoryIconCache[color];
   const icon = new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
   });
   categoryIconCache[color] = icon;
   return icon;
};

// ─── Wikivoyage API ────────────────────────────────────────────────────
const wikiCache = {};
async function fetchWikivoyageInfo(cityName) {
   if (wikiCache[cityName]) return wikiCache[cityName];
   try {
      const url = `https://en.wikivoyage.org/w/api.php?action=query&titles=${encodeURIComponent(cityName)}&prop=extracts&explaintext=1&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return null;
      const page = Object.values(pages)[0];
      if (page.missing !== undefined) return null;
      const fullText = page.extract || '';
      const sections = {};
      const sectionRegex = /^==\s*(.+?)\s*==$/gm;
      let lastIdx = 0, lastSection = 'overview', match;
      const firstHeading = fullText.search(/^==/m);
      sections.overview = firstHeading > 0 ? fullText.substring(0, firstHeading).trim() : fullText.substring(0, 800).trim();
      while ((match = sectionRegex.exec(fullText)) !== null) {
         if (lastIdx > 0) sections[lastSection] = fullText.substring(lastIdx, match.index).trim();
         lastSection = match[1].toLowerCase();
         lastIdx = match.index + match[0].length;
      }
      if (lastIdx > 0) sections[lastSection] = fullText.substring(lastIdx).trim();
      const interestingKeys = ['understand', 'history', 'culture', 'get in', 'see', 'do', 'eat', 'drink', 'buy', 'sleep', 'respect'];
      const result = { overview: sections.overview || '' };
      for (const key of interestingKeys) {
         for (const [sk, sv] of Object.entries(sections)) {
            if (sk.includes(key) && sv.length > 20) {
               result[key] = sv.length > 600 ? sv.substring(0, 600).replace(/\s\S*$/, '…') : sv;
               break;
            }
         }
      }
      wikiCache[cityName] = result;
      return result;
   } catch { return null; }
}

// ─── Wikipedia Image Fetcher ───────────────────────────────────────────
const imgCache = {};
async function fetchWikipediaImage(query) {
   if (imgCache[query]) return imgCache[query];
   try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return null;
      const page = Object.values(pages)[0];
      const thumb = page?.thumbnail?.source;
      if (thumb) { imgCache[query] = thumb; return thumb; }
      return null;
   } catch { return null; }
}

// Smart Image Component: tries Wikipedia for place, then city, then LoremFlickr
function SmartImage({ placeName, cityName, lockId, className, alt }) {
   const [src, setSrc] = useState(null);
   const [loaded, setLoaded] = useState(false);
   const fallback = useMemo(() =>
      `https://loremflickr.com/800/600/morocco,${encodeURIComponent((cityName || placeName || 'morocco').split(' ')[0])}?lock=${lockId}`,
      [placeName, cityName, lockId]
   );

   useEffect(() => {
      let cancelled = false;
      setSrc(null); setLoaded(false);
      (async () => {
         // Try 1: Wikipedia image for the exact place name
         let img = await fetchWikipediaImage(placeName);
         if (!cancelled && img) { setSrc(img); return; }
         // Try 2: Wikipedia image for the city (broader fallback)
         if (cityName && cityName !== placeName) {
            img = await fetchWikipediaImage(cityName);
            if (!cancelled && img) { setSrc(img); return; }
         }
         // Try 3: LoremFlickr as final fallback
         if (!cancelled) setSrc(fallback);
      })();
      return () => { cancelled = true; };
   }, [placeName, cityName, fallback]);

   return (
      <>
         {!loaded && (
            <div className="absolute inset-0 bg-surface-container animate-pulse flex items-center justify-center">
               <span className="material-symbols-outlined text-stone-300 text-4xl">image</span>
            </div>
         )}
         <img
            src={src || fallback}
            alt={alt || placeName}
            className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => { if (src !== fallback) setSrc(fallback); }}
         />
      </>
   );
}

// ─── Map Controller ────────────────────────────────────────────────────
function MapController({ points, activePoint, mode }) {
   const map = useMap();
   useEffect(() => {
      if (!points || points.length === 0) return;
      if (activePoint) {
         const lat = activePoint.lat;
         const lng = activePoint.lng;
         map.setView([lat, lng], mode === 'explore' ? 15 : Math.max(map.getZoom(), 8), { animate: true, duration: 0.8 });
      } else {
         const coords = points.map(p => [p.lat, p.lng]);
         const bounds = L.latLngBounds(coords);
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: mode === 'explore' ? 14 : 10, animate: true });
      }
   }, [points, activePoint, map, mode]);
   return null;
}

// ─── Wiki section metadata ─────────────────────────────────────────────
const SECTION_META = {
   overview: { label: 'Overview', icon: 'info' },
   understand: { label: 'Culture & History', icon: 'museum' },
   history: { label: 'History', icon: 'history_edu' },
   culture: { label: 'Culture', icon: 'diversity_3' },
   see: { label: 'Must See', icon: 'visibility' },
   do: { label: 'Things To Do', icon: 'directions_run' },
   eat: { label: 'Local Cuisine', icon: 'restaurant' },
   drink: { label: 'Drinks & Cafés', icon: 'local_cafe' },
   buy: { label: 'Shopping', icon: 'shopping_bag' },
   'get in': { label: 'Getting There', icon: 'directions_car' },
   respect: { label: 'Etiquette', icon: 'handshake' },
   sleep: { label: 'Where to Stay', icon: 'hotel' },
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function TripPlanner() {
   const [mode, setMode] = useState('roadtrip'); // 'roadtrip' | 'explore'
   const { isSaved, savePlace, removePlace } = useSavedPlaces();

   // Roadtrip state
   const [origin, setOrigin] = useState('');
   const [destination, setDestination] = useState('');
   const [days, setDays] = useState(3);
   const [isGenerating, setIsGenerating] = useState(false);
   const [itinerary, setItinerary] = useState(null);
   const [activeStop, setActiveStop] = useState(null);

   // City Explorer state
   const [exploreCity, setExploreCity] = useState('');
   const [isExploring, setIsExploring] = useState(false);
   const [pois, setPois] = useState(null);
   const [activePoi, setActivePoi] = useState(null);
   const [categoryFilter, setCategoryFilter] = useState('all');
   const [error, setError] = useState(null);

   // Wikivoyage state (shared)
   const [wikiInfo, setWikiInfo] = useState(null);
   const [wikiLoading, setWikiLoading] = useState(false);
   const [activeWikiTab, setActiveWikiTab] = useState('overview');

   // Fetch Wikivoyage when active item changes
   useEffect(() => {
      const cityName = mode === 'roadtrip' ? activeStop?.stopName : (activePoi ? exploreCity : null);
      if (!cityName) { setWikiInfo(null); return; }
      let cancelled = false;
      setWikiLoading(true);
      setActiveWikiTab('overview');
      fetchWikivoyageInfo(cityName).then(info => {
         if (!cancelled) { setWikiInfo(info); setWikiLoading(false); }
      });
      return () => { cancelled = true; };
   }, [activeStop, activePoi, mode, exploreCity]);

   // Handlers
   const handleRoadtrip = async (e) => {
      e.preventDefault();
      if (!origin || !destination) return;
      setIsGenerating(true);
      setItinerary(null); setActiveStop(null); setWikiInfo(null); setError(null);
      try {
         const data = await generateRoadtripItinerary(origin, destination, days);
         if (data?.length > 0) {
            const valid = data.filter(d => d.lat && d.lng);
            if (valid.length > 0) {
               setItinerary(valid);
               setActiveStop(valid[0]);
            } else {
               setError('AI returned stops without coordinates. Please try again.');
            }
         } else {
            setError('Could not generate a route. Please check city names and try again.');
         }
      } catch (err) {
         setError('Network error. Please check your connection and try again.');
      }
      setIsGenerating(false);
   };

   const handleExplore = async (e) => {
      e.preventDefault();
      if (!exploreCity) return;
      setIsExploring(true);
      setPois(null); setActivePoi(null); setWikiInfo(null); setCategoryFilter('all'); setError(null);
      try {
         const data = await generateCityExplorer(exploreCity);
         if (data?.length > 0) {
            const valid = data.filter(d => d.lat && d.lng);
            if (valid.length > 0) {
               setPois(valid);
            } else {
               setError('AI returned places without coordinates. Please try again.');
            }
         } else {
            setError('Could not find places. Please check the city name and try again.');
         }
      } catch (err) {
         setError('Network error. Please check your connection and try again.');
      }
      setIsExploring(false);
   };

   // Cross-mode: explore a city from the roadtrip view
   const exploreThisCity = async (cityName) => {
      setExploreCity(cityName);
      setMode('explore');
      setIsExploring(true);
      setPois(null); setActivePoi(null); setCategoryFilter('all'); setError(null);
      try {
         const data = await generateCityExplorer(cityName);
         if (data?.length > 0) {
            const valid = data.filter(d => d.lat && d.lng);
            if (valid.length > 0) {
               setPois(valid);
            } else {
               setError('AI returned places without coordinates. Please try again.');
            }
         } else {
            setError('Could not find places. Please check the city name and try again.');
         }
      } catch (err) {
         setError('Network error. Please check your connection and try again.');
      }
      setIsExploring(false);
   };

   const backToRoadtrip = () => {
      setMode('roadtrip');
   };

   // Derived
   const polylinePositions = itinerary ? itinerary.map(s => [s.lat, s.lng]) : [];
   const filteredPois = pois ? (categoryFilter === 'all' ? pois : pois.filter(p => p.category?.toLowerCase() === categoryFilter)) : [];
   const mapPoints = mode === 'roadtrip' ? itinerary : filteredPois;
   const activeMapPoint = mode === 'roadtrip' ? activeStop : activePoi;
   const isLoading = mode === 'roadtrip' ? isGenerating : isExploring;
   const hasResults = mode === 'roadtrip' ? itinerary : pois;

   const availableSections = wikiInfo ? Object.keys(wikiInfo).filter(k => wikiInfo[k]?.length > 10) : [];
   const uniqueCategories = pois ? [...new Set(pois.map(p => p.category?.toLowerCase()).filter(Boolean))] : [];

   return (
      <div className="trip-planner-container page-content glass min-h-screen pb-32 md:pb-8">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6 animate-fade-in-up pt-4 md:pt-0">
            <div className="max-w-xl">
               <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tighter mb-4 leading-tight">
                  Moroccan Roadtrip Planner
               </h1>
               <p className="text-on-surface-variant text-base md:text-lg font-medium leading-relaxed">
                  Let our AI forge the perfect journey. Uncover hidden gems within any Moroccan city.
               </p>
            </div>
         </div>

         {/* Mode Toggle Segmented Control */}
         <div className="flex w-full md:w-auto bg-surface-container-lowest border border-outline-variant/30 p-1.5 rounded-2xl mb-6 animate-fade-in-up shadow-sm" style={{ animationDelay: '0.15s' }}>
            <button
               onClick={() => setMode('roadtrip')}
               className={`flex-1 md:flex-none relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${mode === 'roadtrip'
                     ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                     : 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
            >
               <Navigation size={18} /> Roadtrip
               {mode !== 'roadtrip' && itinerary && (
                  <span className="absolute top-2 right-2 md:-top-1 md:-right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white shadow-sm animate-pulse" title={`Route: ${origin} → ${destination}`}></span>
               )}
            </button>
            <button
               onClick={() => setMode('explore')}
               className={`flex-1 md:flex-none relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${mode === 'explore'
                     ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                     : 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
            >
               <Search size={18} /> Explore City
               {mode !== 'explore' && pois && (
                  <span className="absolute top-2 right-2 md:-top-1 md:-right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white shadow-sm animate-pulse" title={`${pois.length} places in ${exploreCity}`}></span>
               )}
            </button>
         </div>

         {/* ─── ROADTRIP FORM ─────────────────────────────────────────── */}
         {mode === 'roadtrip' && (
            <Card className="mb-4 p-6 bg-surface-container-lowest shadow-[0_12px_32px_rgba(25,28,28,0.06)] border border-primary/10 animate-slide-in">
               <form onSubmit={handleRoadtrip} className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                  <div className="flex-1 w-full">
                     <label className="text-sm font-bold text-stone-500 uppercase tracking-wider ml-1 mb-2 block">Origin</label>
                     <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Rabat"
                           className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface text-base" required />
                     </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center h-12 w-12 rounded-full bg-primary/5 border border-primary/20 text-primary self-end mb-1 shrink-0">
                     <Navigation size={20} className="rotate-90" />
                  </div>
                  <div className="flex-1 w-full relative">
                     <label className="text-sm font-bold text-stone-500 uppercase tracking-wider ml-1 mb-2 block">Destination</label>
                     <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                        <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Marrakech"
                           className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border border-primary/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface font-semibold text-base" required />
                     </div>
                  </div>
                  <div className="w-full md:w-32">
                     <label className="text-sm font-bold text-stone-500 uppercase tracking-wider ml-1 mb-2 block">Days</label>
                     <input type="number" min="1" max="14" value={days} onChange={e => setDays(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface text-center font-semibold text-base" required />
                  </div>
                  <button type="submit" disabled={isGenerating}
                     className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-teal-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 h-[52px] whitespace-nowrap disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed font-headline">
                     {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Routing...</> : <><Compass size={18} /> Generate</>}
                  </button>
               </form>
            </Card>
         )}

         {/* ─── CITY EXPLORER FORM ────────────────────────────────────── */}
         {mode === 'explore' && (
            <Card className="mb-4 p-6 bg-surface-container-lowest shadow-[0_12px_32px_rgba(25,28,28,0.06)] border border-primary/10 animate-slide-in">
               <form onSubmit={handleExplore} className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                  <div className="flex-1 w-full">
                     <label className="text-sm font-bold text-stone-500 uppercase tracking-wider ml-1 mb-2 block">Which City?</label>
                     <div className="relative">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                        <input type="text" value={exploreCity} onChange={e => setExploreCity(e.target.value)} placeholder="e.g. Marrakech, Fes, Chefchaouen..."
                           className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border border-amber-300/40 focus:ring-2 focus:ring-amber-300/30 outline-none transition-all text-on-surface font-semibold text-base" required />
                     </div>
                  </div>
                  <button type="submit" disabled={isExploring}
                     className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 h-[52px] whitespace-nowrap disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed font-headline">
                     {isExploring ? <><Loader2 className="animate-spin" size={18} /> Exploring...</> : <><Search size={18} /> Discover</>}
                  </button>
               </form>
            </Card>
         )}

         {/* ─── EMPTY STATE ───────────────────────────────────────────── */}
         {!hasResults && !isLoading && (
            <div className="text-center py-20 bg-surface-container-lowest/50 rounded-[2.5rem] border-2 border-dashed border-outline-variant/30 mt-6 animate-fade-in-up">
               {mode === 'roadtrip' ? (
                  <>
                     <Compass size={56} className="mx-auto text-stone-300 mb-6 animate-float" />
                     <h3 className="text-2xl font-bold text-on-surface font-headline mb-3 tracking-tight">Where to next?</h3>
                     <p className="text-on-surface-variant max-w-sm mx-auto text-base leading-relaxed">Enter your starting point and destination to uncover a personalized, scenic route designed by AI.</p>
                  </>
               ) : (
                  <>
                     <Sparkles size={56} className="mx-auto text-amber-300 mb-6 animate-float" />
                     <h3 className="text-2xl font-bold text-on-surface font-headline mb-3 tracking-tight">Pick a city to explore</h3>
                     <p className="text-on-surface-variant max-w-sm mx-auto text-base leading-relaxed">Type the name of any Moroccan city and we'll map out the best places to eat, visit, and experience.</p>
                  </>
               )}
            </div>
         )}

         {/* ─── ERROR STATE ───────────────────────────────────────────── */}
         {error && !isLoading && (
            <div className="text-center py-12 bg-red-50 rounded-[2rem] border border-red-200/50 mt-6 animate-fade-in-up">
               <span className="material-symbols-outlined text-red-400 text-5xl mb-4 block">error_outline</span>
               <h3 className="text-lg font-bold text-red-800 font-headline mb-2">Something went wrong</h3>
               <p className="text-red-600 text-sm max-w-md mx-auto">{error}</p>
            </div>
         )}

         {/* ─── LOADING STATE ─────────────────────────────────────────── */}
         {isLoading && (
            <div className="text-center py-20 bg-surface-container-lowest/80 rounded-[2.5rem] mt-6 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 animate-gradient-shift"></div>
               <Loader2 className="animate-spin text-primary mb-6 relative z-10" size={48} />
               <h3 className="text-xl font-bold text-on-surface font-headline mb-2 animate-pulse relative z-10">
                  {mode === 'roadtrip' ? 'Calculating the perfect route...' : `Discovering ${exploreCity}...`}
               </h3>
               <p className="text-on-surface-variant relative z-10">
                  {mode === 'roadtrip' ? 'Mapping coordinates and analyzing Moroccan topography.' : 'Finding the best landmarks, food, and hidden gems.'}
               </p>
            </div>
         )}

         {/* ─── RESULTS: SPLIT VIEW (MAP + DETAILS) ──────────────────── */}
         {hasResults && !isLoading && (
            <div className="flex flex-col lg:flex-row gap-6 mt-6 animate-fade-in-up" style={{ minHeight: '700px' }}>

               {/* Map Area */}
               <div className="w-full lg:w-3/5 h-[500px] lg:h-auto lg:min-h-[700px] rounded-[2rem] overflow-hidden border-4 border-surface-container-lowest shadow-lg relative z-0">
                  <MapContainer center={[31.7917, -7.0926]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                     <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                     />
                     <MapController points={mapPoints} activePoint={activeMapPoint} mode={mode} />

                     {/* Roadtrip polyline */}
                     {mode === 'roadtrip' && itinerary && (
                        <Polyline positions={polylinePositions} color="#426464" weight={4} dashArray="8, 10" />
                     )}

                     {/* Roadtrip markers */}
                     {mode === 'roadtrip' && itinerary?.map((stop, idx) => (
                        <Marker key={idx} position={[stop.lat, stop.lng]}
                           icon={activeStop?.stopName === stop.stopName ? activeIcon : customIcon}
                           eventHandlers={{ click: () => setActiveStop(stop) }}>
                           <Popup><strong>{stop.stopName}</strong><br />{stop.day}</Popup>
                        </Marker>
                     ))}

                     {/* City Explorer markers */}
                     {mode === 'explore' && filteredPois?.map((poi, idx) => (
                        <Marker key={idx} position={[poi.lat, poi.lng]}
                           icon={activePoi?.name === poi.name ? activeIcon : getCategoryIcon(poi.category)}
                           eventHandlers={{ click: () => setActivePoi(poi) }}>
                           <Popup><strong>{poi.name}</strong><br /><em>{poi.category}</em></Popup>
                        </Marker>
                     ))}
                  </MapContainer>
               </div>

               {/* Details Area */}
               <div className="w-full lg:w-2/5 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '100vh' }}>

                  {/* ── CITY EXPLORER: Category Filters ── */}
                  {mode === 'explore' && pois && (
                     <div className="flex flex-wrap gap-2 mb-4 animate-fade-in-up">
                        {/* Back to roadtrip button (only if a roadtrip exists) */}
                        {itinerary && (
                           <button onClick={backToRoadtrip}
                              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:scale-105 hover:shadow-sm">
                              <Navigation size={12} /> Back to roadtrip
                           </button>
                        )}
                        <button onClick={() => setCategoryFilter('all')}
                           className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${categoryFilter === 'all' ? 'bg-primary text-white shadow-md scale-105' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:scale-105'}`}>
                           All ({pois.length})
                        </button>
                        {uniqueCategories.map(cat => {
                           const meta = CATEGORY_COLORS[cat] || CATEGORY_COLORS.landmark;
                           return (
                              <button key={cat} onClick={() => setCategoryFilter(cat)}
                                 className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${categoryFilter === cat ? `${meta.bg} ${meta.text} shadow-md scale-105` : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:scale-105'
                                    }`}>
                                 <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                                 {cat}
                              </button>
                           );
                        })}
                     </div>
                  )}

                  {/* ── ROADTRIP DETAILS ── */}
                  {mode === 'roadtrip' && activeStop && (
                     <div className="animate-detail-enter">
                        <Card className="flex flex-col gap-0 p-0 overflow-hidden bg-surface-container-lowest border-0 shadow-[0_12px_32px_rgba(25,28,28,0.08)] rounded-[2rem]">
                           <div className="w-full h-56 relative overflow-hidden shrink-0">
                              <SmartImage placeName={activeStop.stopName} cityName={activeStop.stopName} lockId={itinerary.indexOf(activeStop) + 100}
                                 alt={activeStop.stopName} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent"></div>
                              <div className="absolute bottom-5 left-5 text-white">
                                 <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full mb-2 inline-block shadow-sm">
                                    {activeStop.day || `Stop ${itinerary.indexOf(activeStop) + 1}`}
                                 </span>
                                 <h3 className="text-3xl font-extrabold font-headline tracking-tighter text-white mt-1">{activeStop.stopName}</h3>
                              </div>
                              {/* Add to Saved Places */}
                              <button
                                 onClick={() => isSaved(activeStop.stopName) ? removePlace(activeStop.stopName) : savePlace({ ...activeStop, id: activeStop.stopName, name: activeStop.stopName, category: 'Roadtrip Stop', city: activeStop.stopName })}
                                 className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 hover:bg-black/60 transition-all z-10"
                                 title={isSaved(activeStop.stopName) ? "Remove from saved" : "Save this place"}
                              >
                                 <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved(activeStop.stopName) ? "'FILL' 1" : "'FILL' 0", color: isSaved(activeStop.stopName) ? '#ef4444' : 'white' }}>bookmark</span>
                              </button>
                           </div>
                           <div className="p-6 bg-surface-container-lowest">
                              <p className="text-on-surface-variant leading-relaxed text-sm mb-5 border-l-4 border-primary/30 pl-4">{activeStop.description}</p>
                              <div className="space-y-3">
                                 <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-outline-variant/20 pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">explore</span> AI-Recommended Activities
                                 </h4>
                                 <ul className="flex flex-col gap-2">
                                    {activeStop.activities?.map((act, i) => (
                                       <li key={i} className="text-on-surface text-sm flex items-start gap-3 bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant/20 animate-stagger-in" style={{ animationDelay: `${i * 0.06}s` }}>
                                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                             <span className="material-symbols-outlined text-[12px]">bolt</span>
                                          </div>
                                          <span className="leading-snug">{act}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>

                              {/* Explore this city CTA */}
                              <button
                                 onClick={() => exploreThisCity(activeStop.stopName)}
                                 className="w-full mt-5 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/15 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                              >
                                 <Search size={16} />
                                 Explore {activeStop.stopName}
                                 <span className="text-[10px] ml-1 opacity-80 font-normal">— see all places & things to do</span>
                              </button>
                           </div>
                        </Card>
                     </div>
                  )}

                  {/* ── CITY EXPLORER DETAILS ── */}
                  {mode === 'explore' && activePoi && (
                     <div className="animate-detail-enter">
                        <Card className="flex flex-col gap-0 p-0 overflow-hidden bg-surface-container-lowest border-0 shadow-[0_12px_32px_rgba(25,28,28,0.08)] rounded-[2rem]">
                           <div className="w-full h-48 relative overflow-hidden shrink-0">
                              <SmartImage placeName={activePoi.name} cityName={exploreCity} lockId={pois.indexOf(activePoi) + 200}
                                 alt={activePoi.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent"></div>
                              <div className="absolute bottom-4 left-5 text-white">
                                 {(() => {
                                    const meta = CATEGORY_COLORS[activePoi.category?.toLowerCase()] || CATEGORY_COLORS.landmark;
                                    return (
                                       <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.bg} ${meta.text} px-3 py-1.5 rounded-full mb-2 inline-flex items-center gap-1 shadow-sm`}>
                                          <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
                                          {activePoi.category}
                                       </span>
                                    );
                                 })()}
                                 <h3 className="text-2xl font-extrabold font-headline tracking-tighter text-white mt-1">{activePoi.name}</h3>
                              </div>
                              {/* Popularity badge */}
                              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold">
                                 <span className="material-symbols-outlined text-amber-400 text-[14px]">{activePoi.popularity >= 8 ? 'local_fire_department' : activePoi.popularity >= 5 ? 'star' : 'diamond'}</span>
                                 {activePoi.popularity}/10
                              </div>
                              {/* Add to Saved Places */}
                              <button
                                 onClick={() => isSaved(activePoi.name) ? removePlace(activePoi.name) : savePlace({ ...activePoi, id: activePoi.name, type: 'poi', city: exploreCity })}
                                 className="absolute top-14 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 hover:bg-black/60 transition-all z-10"
                                 title={isSaved(activePoi.name) ? "Remove from saved" : "Save this place"}
                              >
                                 <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved(activePoi.name) ? "'FILL' 1" : "'FILL' 0", color: isSaved(activePoi.name) ? '#ef4444' : 'white' }}>bookmark</span>
                              </button>
                           </div>
                           <div className="p-6 bg-surface-container-lowest">
                              {/* Popularity meter */}
                              <div className="mb-4">
                                 <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{activePoi.popularity >= 8 ? '🔥 Iconic' : activePoi.popularity >= 5 ? '⭐ Popular' : '💎 Hidden Gem'}</span>
                                    <span className="text-xs font-semibold text-on-surface-variant">{activePoi.popularity}/10 popularity</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${activePoi.popularity >= 8 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : activePoi.popularity >= 5 ? 'bg-gradient-to-r from-teal-400 to-primary' : 'bg-gradient-to-r from-purple-400 to-indigo-500'}`}
                                       style={{ width: `${(activePoi.popularity || 5) * 10}%` }}></div>
                                 </div>
                              </div>
                              <p className="text-on-surface-variant leading-relaxed text-sm mb-4">{activePoi.description}</p>
                              {activePoi.tips && (
                                 <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/50 px-4 py-3 rounded-xl">
                                    <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">lightbulb</span>
                                    <div>
                                       <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">Pro Tip</p>
                                       <p className="text-sm text-amber-900 leading-snug">{activePoi.tips}</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </Card>
                     </div>
                  )}

                  {/* ── EMPTY DETAIL STATE ── */}
                  {!activeMapPoint && (
                     <div className="flex items-center justify-center p-8 bg-surface-container-lowest/50 rounded-[2rem] border-2 border-dashed border-outline-variant/30 animate-fade-in-up" style={{ minHeight: 250 }}>
                        <div className="text-center">
                           <MapPin size={48} className="mx-auto text-stone-300 mb-4 animate-float" />
                           <h4 className="text-xl font-bold text-on-surface mb-2">
                              {mode === 'roadtrip' ? 'Select a Destination' : 'Tap a Place'}
                           </h4>
                           <p className="text-on-surface-variant">Click on any marker on the map to view details.</p>
                        </div>
                     </div>
                  )}

                  {/* ── WIKIVOYAGE CARD ── */}
                  {activeMapPoint && (
                     <Card className="mt-4 p-0 overflow-hidden bg-surface-container-lowest border-0 shadow-[0_8px_24px_rgba(25,28,28,0.06)] rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                        <div className="px-6 pt-5 pb-3 border-b border-outline-variant/15 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <BookOpen size={16} />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-on-surface">Wikivoyage Travel Guide</h4>
                              <p className="text-xs text-on-surface-variant">Culture, history & travel tips</p>
                           </div>
                        </div>
                        {wikiLoading && (
                           <div className="p-8 text-center">
                              <Loader2 className="animate-spin text-primary mx-auto mb-3" size={24} />
                              <p className="text-sm text-on-surface-variant">Loading travel guide...</p>
                           </div>
                        )}
                        {!wikiLoading && !wikiInfo && (
                           <div className="p-8 text-center">
                              <Info size={32} className="mx-auto text-stone-300 mb-3" />
                              <p className="text-sm text-on-surface-variant">No Wikivoyage article found.</p>
                           </div>
                        )}
                        {!wikiLoading && wikiInfo && availableSections.length > 0 && (
                           <>
                              <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                                 {availableSections.map(key => {
                                    const meta = SECTION_META[key] || { label: key, icon: 'article' };
                                    return (
                                       <button key={key} onClick={() => setActiveWikiTab(key)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeWikiTab === key ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                                             }`}>
                                          <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                                          {meta.label}
                                       </button>
                                    );
                                 })}
                              </div>
                              <div className="p-6 pt-4">
                                 <div className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{wikiInfo[activeWikiTab] || 'No information available.'}</div>
                                 <a href={`https://en.wikivoyage.org/wiki/${encodeURIComponent(mode === 'roadtrip' ? activeStop?.stopName : exploreCity)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-4 text-xs text-primary font-semibold hover:underline">
                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span> Read full article →
                                 </a>
                              </div>
                           </>
                        )}
                     </Card>
                  )}

                  {/* ── JOURNEY OVERVIEW / POI LIST ── */}
                  <div className="mt-6 flex flex-col gap-3 pb-8">
                     <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                        {mode === 'roadtrip' ? 'Journey Overview' : `Places in ${exploreCity}`}
                     </h4>

                     {mode === 'roadtrip' && itinerary?.map((stop, i) => (
                        <button key={i} onClick={() => setActiveStop(stop)}
                           className={`text-left px-5 py-3 rounded-xl border transition-all duration-300 flex items-center gap-4 animate-stagger-in ${activeStop?.stopName === stop.stopName ? 'bg-primary/5 border-primary text-primary scale-[1.01]' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 text-on-surface hover:translate-x-1'
                              }`} style={{ animationDelay: `${i * 0.05}s` }}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${activeStop?.stopName === stop.stopName ? 'bg-primary text-white' : 'bg-surface-container text-stone-500'
                              }`}>{i + 1}</div>
                           <span className="font-semibold">{stop.stopName}</span>
                        </button>
                     ))}

                     {mode === 'explore' && filteredPois?.map((poi, i) => {
                        const meta = CATEGORY_COLORS[poi.category?.toLowerCase()] || CATEGORY_COLORS.landmark;
                        const pop = poi.popularity || 5;
                        return (
                           <button key={i} onClick={() => setActivePoi(poi)}
                              className={`text-left px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-3 animate-stagger-in ${activePoi?.name === poi.name ? 'bg-primary/5 border-primary text-primary scale-[1.01]' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 text-on-surface hover:translate-x-1'
                                 }`} style={{ animationDelay: `${i * 0.04}s` }}>
                              <div className="text-xs font-bold text-stone-400 w-5 text-center shrink-0">#{i + 1}</div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                                 <span className={`material-symbols-outlined text-[16px] ${meta.text}`}>{meta.icon}</span>
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                 <span className="font-semibold text-sm truncate">{poi.name}</span>
                                 <span className="text-xs text-on-surface-variant capitalize">{poi.category}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                 <span className={`material-symbols-outlined text-[12px] ${pop >= 8 ? 'text-amber-500' : pop >= 5 ? 'text-teal-500' : 'text-purple-400'}`}>
                                    {pop >= 8 ? 'local_fire_department' : pop >= 5 ? 'star' : 'diamond'}
                                 </span>
                                 <span className="text-xs font-bold text-stone-400">{pop}</span>
                              </div>
                           </button>
                        );
                     })}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
