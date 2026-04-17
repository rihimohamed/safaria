import React, { useState, useMemo } from 'react';
import {
  Backpack, Sparkles, Plus, Minus, Trash2, Edit3, Check, X,
  CloudSun, MapPin, Calendar, Users, Weight, Share2, Download,
  Shirt, Glasses, Briefcase, Heart, AlertTriangle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import Card from '../components/Card';
import AIWidget from '../components/AIWidget';
import WeatherWidget from '../components/WeatherWidget';
import './SmartBackpack.css';

// Mock trip context
const TRIP_CONTEXT = {
  destination: 'Bali, Indonesia',
  dates: 'Oct 12 – Oct 19',
  duration: 7,
  weather: { temp: '30', condition: 'Tropical', rain: true },
  activities: ['Beach', 'Snorkeling', 'Temple Visit', 'Hiking'],
  travelType: 'Couple',
};

// Initial AI-generated packing list
const INITIAL_ITEMS = [
  {
    category: 'Clothing',
    icon: 'shirt',
    items: [
      { id: 1, name: 'T-Shirts', qty: 5, packed: false, essential: true, weight: 0.2 },
      { id: 2, name: 'Shorts', qty: 3, packed: false, essential: true, weight: 0.25 },
      { id: 3, name: 'Light Jacket', qty: 1, packed: false, essential: true, weight: 0.5 },
      { id: 4, name: 'Swim Trunks', qty: 2, packed: false, essential: true, weight: 0.15 },
      { id: 5, name: 'Casual Pants', qty: 2, packed: false, essential: false, weight: 0.4 },
      { id: 6, name: 'Rain Poncho', qty: 1, packed: false, essential: true, weight: 0.2 },
    ],
  },
  {
    category: 'Accessories',
    icon: 'glasses',
    items: [
      { id: 7, name: 'Sunglasses', qty: 1, packed: false, essential: true, weight: 0.05 },
      { id: 8, name: 'Sun Hat', qty: 1, packed: false, essential: false, weight: 0.1 },
      { id: 9, name: 'Umbrella (compact)', qty: 1, packed: false, essential: true, weight: 0.3 },
      { id: 10, name: 'Reef-safe Sunscreen', qty: 1, packed: false, essential: true, weight: 0.15 },
    ],
  },
  {
    category: 'Travel Essentials',
    icon: 'briefcase',
    items: [
      { id: 11, name: 'Passport', qty: 1, packed: true, essential: true, weight: 0.05 },
      { id: 12, name: 'Travel Insurance Docs', qty: 1, packed: false, essential: true, weight: 0.02 },
      { id: 13, name: 'Phone Charger + Adapter', qty: 1, packed: false, essential: true, weight: 0.2 },
      { id: 14, name: 'Power Bank', qty: 1, packed: false, essential: false, weight: 0.3 },
      { id: 15, name: 'Reusable Water Bottle', qty: 1, packed: false, essential: false, weight: 0.15 },
    ],
  },
  {
    category: 'Health & Safety',
    icon: 'heart',
    items: [
      { id: 16, name: 'First Aid Kit', qty: 1, packed: false, essential: true, weight: 0.3 },
      { id: 17, name: 'Insect Repellent', qty: 1, packed: false, essential: true, weight: 0.1 },
      { id: 18, name: 'Prescription Meds', qty: 1, packed: false, essential: true, weight: 0.05 },
    ],
  },
];

const AI_TIPS = [
  "Pack light layers — Bali evenings can be cooler in the highlands.",
  "Bring waterproof bags for electronics during monsoon showers.",
  "Temple visits require sarongs — many temples provide them, but best to pack your own.",
  "Reef-safe sunscreen is required for snorkeling areas.",
];

const CATEGORY_ICONS = {
  shirt: <Shirt size={20} />,
  glasses: <Glasses size={20} />,
  briefcase: <Briefcase size={20} />,
  heart: <Heart size={20} />,
};

export default function SmartBackpack() {
  const [categories, setCategories] = useState(INITIAL_ITEMS);
  const [expandedCats, setExpandedCats] = useState(
    INITIAL_ITEMS.reduce((acc, c) => ({ ...acc, [c.category]: true }), {})
  );
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [newItemCat, setNewItemCat] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  // Toggle packed
  const togglePacked = (catIndex, itemId) => {
    setCategories(prev =>
      prev.map((cat, ci) =>
        ci !== catIndex ? cat : {
          ...cat,
          items: cat.items.map(it => it.id === itemId ? { ...it, packed: !it.packed } : it),
        }
      )
    );
  };

  // Quantity adjust
  const adjustQty = (catIndex, itemId, delta) => {
    setCategories(prev =>
      prev.map((cat, ci) =>
        ci !== catIndex ? cat : {
          ...cat,
          items: cat.items.map(it =>
            it.id === itemId ? { ...it, qty: Math.max(1, it.qty + delta) } : it
          ),
        }
      )
    );
  };

  // Remove item
  const removeItem = (catIndex, itemId) => {
    setCategories(prev =>
      prev.map((cat, ci) =>
        ci !== catIndex ? cat : { ...cat, items: cat.items.filter(it => it.id !== itemId) }
      )
    );
  };

  // Edit item name
  const startEdit = (itemId, name) => { setEditingItem(itemId); setEditName(name); };
  const saveEdit = (catIndex, itemId) => {
    if (!editName.trim()) return;
    setCategories(prev =>
      prev.map((cat, ci) =>
        ci !== catIndex ? cat : {
          ...cat,
          items: cat.items.map(it => it.id === itemId ? { ...it, name: editName.trim() } : it),
        }
      )
    );
    setEditingItem(null);
  };

  // Add item
  const addItem = (catIndex) => {
    if (!newItemName.trim()) return;
    const maxId = categories.flatMap(c => c.items).reduce((max, it) => Math.max(max, it.id), 0);
    setCategories(prev =>
      prev.map((cat, ci) =>
        ci !== catIndex ? cat : {
          ...cat,
          items: [...cat.items, { id: maxId + 1, name: newItemName.trim(), qty: 1, packed: false, essential: false, weight: 0.1 }],
        }
      )
    );
    setNewItemName('');
    setNewItemCat(null);
  };

  // Stats
  const stats = useMemo(() => {
    const all = categories.flatMap(c => c.items);
    const total = all.length;
    const packed = all.filter(i => i.packed).length;
    const essential = all.filter(i => i.essential);
    const missingEssential = essential.filter(i => !i.packed).length;
    const totalWeight = all.reduce((sum, i) => sum + i.weight * i.qty, 0);
    return { total, packed, missingEssential, totalWeight };
  }, [categories]);

  return (
    <div className="backpack-container">
      {/* Header */}
      <div className="backpack-header">
        <div className="backpack-title">
          <Backpack size={32} className="backpack-icon" />
          <div>
            <h2>Smart Backpack</h2>
            <p>AI-generated packing list for your trip</p>
          </div>
        </div>
        <div className="backpack-actions">
          <button className="bp-action-btn"><Share2 size={16} /> Share</button>
          <button className="bp-action-btn"><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="backpack-layout">
        {/* Left: Packing List */}
        <div className="backpack-main">
          {/* Progress Bar */}
          <Card className="progress-card">
            <div className="progress-header">
              <span className="progress-label">{stats.packed} of {stats.total} items packed</span>
              <span className="progress-percentage">{stats.total > 0 ? Math.round((stats.packed / stats.total) * 100) : 0}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stats.total > 0 ? (stats.packed / stats.total) * 100 : 0}%` }}></div>
            </div>
            {stats.missingEssential > 0 && (
              <div className="missing-alert">
                <AlertTriangle size={14} /> {stats.missingEssential} essential item{stats.missingEssential > 1 ? 's' : ''} not yet packed
              </div>
            )}
          </Card>

          {/* Category Sections */}
          {categories.map((cat, catIndex) => (
            <div key={cat.category} className="category-section">
              <button
                className="category-header"
                onClick={() => setExpandedCats(prev => ({ ...prev, [cat.category]: !prev[cat.category] }))}
              >
                <div className="cat-header-left">
                  <div className="cat-icon">{CATEGORY_ICONS[cat.icon]}</div>
                  <h3>{cat.category}</h3>
                  <span className="cat-count">{cat.items.filter(i => i.packed).length}/{cat.items.length}</span>
                </div>
                {expandedCats[cat.category] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedCats[cat.category] && (
                <div className="category-items">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`pack-item ${item.packed ? 'packed' : ''} ${item.essential ? 'essential' : ''} ${!item.essential && !item.packed ? 'optional' : ''}`}
                    >
                      <button className="pack-checkbox" onClick={() => togglePacked(catIndex, item.id)}>
                        {item.packed ? <Check size={16} /> : <div className="empty-check"></div>}
                      </button>

                      <div className="pack-item-info">
                        {editingItem === item.id ? (
                          <div className="edit-row">
                            <input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit(catIndex, item.id)}
                              autoFocus
                            />
                            <button className="edit-save" onClick={() => saveEdit(catIndex, item.id)}><Check size={14} /></button>
                            <button className="edit-cancel" onClick={() => setEditingItem(null)}><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="item-name">{item.name}</span>
                            {item.essential && <span className="essential-badge">Essential</span>}
                          </>
                        )}
                      </div>

                      <div className="pack-item-controls">
                        <div className="qty-control">
                          <button onClick={() => adjustQty(catIndex, item.id, -1)}><Minus size={14} /></button>
                          <span className="qty-value">{item.qty}</span>
                          <button onClick={() => adjustQty(catIndex, item.id, 1)}><Plus size={14} /></button>
                        </div>
                        <button className="item-edit-btn" onClick={() => startEdit(item.id, item.name)}><Edit3 size={14} /></button>
                        <button className="item-remove-btn" onClick={() => removeItem(catIndex, item.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}

                  {/* Add Item */}
                  {newItemCat === catIndex ? (
                    <div className="add-item-row">
                      <input
                        placeholder="New item name..."
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem(catIndex)}
                        autoFocus
                      />
                      <button className="add-confirm" onClick={() => addItem(catIndex)}><Check size={14} /></button>
                      <button className="add-cancel" onClick={() => { setNewItemCat(null); setNewItemName(''); }}><X size={14} /></button>
                    </div>
                  ) : (
                    <button className="add-item-btn" onClick={() => setNewItemCat(catIndex)}>
                      <Plus size={14} /> Add Item
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="backpack-sidebar">
          {/* Trip Context Card */}
          <Card className="trip-context-card">
            <h4>Trip Details</h4>
            <div className="context-row"><MapPin size={16} /> <span>{TRIP_CONTEXT.destination}</span></div>
            <div className="context-row"><Calendar size={16} /> <span>{TRIP_CONTEXT.dates}</span></div>
            <div className="context-row"><Users size={16} /> <span>{TRIP_CONTEXT.travelType}</span></div>
            <div className="context-row"><CloudSun size={16} /> <span>{TRIP_CONTEXT.weather.temp}°C, {TRIP_CONTEXT.weather.condition}</span></div>
            <div className="activity-tags">
              {TRIP_CONTEXT.activities.map((a, i) => (
                <span key={i} className="activity-tag">{a}</span>
              ))}
            </div>
          </Card>

          {/* Weather */}
          <WeatherWidget temp={TRIP_CONTEXT.weather.temp} condition={TRIP_CONTEXT.weather.condition} location={TRIP_CONTEXT.destination} />

          {/* Weight Estimator */}
          <Card className="weight-card">
            <div className="weight-header">
              <Weight size={20} /> <h4>Weight Estimate</h4>
            </div>
            <div className="weight-value">{stats.totalWeight.toFixed(1)} kg</div>
            <div className="weight-bar-track">
              <div className="weight-bar-fill" style={{ width: `${Math.min((stats.totalWeight / 15) * 100, 100)}%` }}></div>
            </div>
            <div className="weight-labels">
              <span>0 kg</span>
              <span className="weight-limit">Carry-on: 7kg</span>
              <span>15 kg</span>
            </div>
            {stats.totalWeight > 7 && (
              <div className="weight-warning">
                <AlertTriangle size={14} /> Exceeds typical carry-on limit
              </div>
            )}
          </Card>

          {/* AI Tips */}
          <Card className="tips-card">
            <div className="tips-header">
              <Sparkles size={18} className="tips-icon" /> <h4>AI Packing Tips</h4>
            </div>
            <ul className="tips-list">
              {AI_TIPS.map((tip, i) => (
                <li key={i}>
                  <Info size={14} className="tip-bullet" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Restriction Alerts */}
          <Card className="alerts-card">
            <div className="alerts-header">
              <AlertTriangle size={18} className="alert-icon" /> <h4>Travel Restrictions</h4>
            </div>
            <ul className="alerts-list">
              <li>Liquids must be under 100ml for carry-on</li>
              <li>Bali customs may restrict certain food items</li>
              <li>Check airline baggage weight limits</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
