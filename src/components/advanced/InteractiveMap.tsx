import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, Pharmacy, Language } from '../../types';
import { getTranslation } from '../../locales';
import { MapPin, PhoneCall, Navigation, Layers, Hospital as HospIcon, Pill, RotateCcw, Search, ExternalLink, ShieldCheck } from 'lucide-react';

// Fix Leaflet marker icons in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// District coordinate centers in Tamil Nadu
const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Coimbatore': [11.0168, 76.9558],
  'Madurai': [9.9252, 78.1198],
  'Salem': [11.6643, 78.1460],
  'Tiruchirappalli': [10.7905, 78.7047],
  'Tirunelveli': [8.7139, 77.7567],
  'Erode': [11.3410, 77.7172],
  'Tiruppur': [11.1085, 77.3411],
  'Vellore': [12.9165, 79.1325],
  'Thanjavur': [10.7870, 79.1378],
  'Dindigul': [10.3673, 77.9803],
  'Nilgiris': [11.4102, 76.6950],
  'Dharmapuri': [12.1211, 78.1582]
};

interface InteractiveMapProps {
  language: Language;
  userDistrict: string;
  hospitals: Hospital[];
  pharmacies: Pharmacy[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  language,
  userDistrict,
  hospitals = [],
  pharmacies = []
}) => {
  const t = getTranslation(language);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.FeatureGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HOSPITALS' | 'PHARMACIES'>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Determine initial center
  const getDistrictCenter = (): [number, number] => {
    if (DISTRICT_COORDINATES[userDistrict]) {
      return DISTRICT_COORDINATES[userDistrict];
    }
    if (hospitals.length > 0 && hospitals[0].lat && hospitals[0].lng) {
      return [hospitals[0].lat, hospitals[0].lng];
    }
    return [11.0168, 76.9558]; // Default Coimbatore
  };

  // 1. Initialize Leaflet Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map already initialized, clean up completely
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
      try {
        delete (mapContainerRef.current as any)._leaflet_id;
      } catch {
        (mapContainerRef.current as any)._leaflet_id = undefined;
      }
    }

    const center = getDistrictCenter();

    try {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 11,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap tiles with high reliability
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const markerGroup = L.featureGroup().addTo(map);
      markerGroupRef.current = markerGroup;
      mapInstanceRef.current = map;
      setIsMapReady(true);

      // Invalidate map size to prevent gray tiles in responsive layouts
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      // Window resize listener to handle dynamic viewport and tab resizing cleanly
      const handleMapResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleMapResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleMapResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
          try {
            delete (mapContainerRef.current as any)._leaflet_id;
          } catch {
            (mapContainerRef.current as any)._leaflet_id = undefined;
          }
        }
      };
    } catch (err) {
      console.error('Failed to initialize Leaflet GIS map:', err);
    }
  }, [userDistrict]);

  // 2. Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || !isMapReady) return;

    markerGroup.clearLayers();

    const createIcon = (bgGradient: string, iconSymbol: string, borderColor: string) => {
      return L.divIcon({
        className: 'custom-gis-pin',
        html: `
          <div style="background: ${bgGradient}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2.5px solid ${borderColor}; cursor: pointer; transform: scale(1); transition: transform 0.15s ease;">
            ${iconSymbol}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
    };

    const filterQuery = searchQuery.trim().toLowerCase();

    // Add Hospitals
    if (activeFilter === 'ALL' || activeFilter === 'HOSPITALS') {
      const filteredHospitals = hospitals.filter(h =>
        filterQuery === '' ||
        h.name.toLowerCase().includes(filterQuery) ||
        h.district.toLowerCase().includes(filterQuery) ||
        h.address.toLowerCase().includes(filterQuery)
      );

      filteredHospitals.forEach(hosp => {
        if (!hosp.lat || !hosp.lng) return;
        const totalBeds = hosp.beds?.reduce((a, b) => a + (b.availableBeds || 0), 0) || 0;
        const icuBeds = hosp.beds?.find(b => b.category === 'ICU')?.availableBeds || 0;

        const icon = createIcon(
          'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
          '🏥',
          '#FFFFFF'
        );

        const marker = L.marker([hosp.lat, hosp.lng], { icon });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 2px 4px;">
            <strong style="color: #1E40AF;">${hosp.name}</strong><br/>
            <span>${totalBeds} Beds (${icuBeds} ICU) Ready</span>
          </div>
        `, { direction: 'top', offset: [0, -18] });

        marker.on('click', () => {
          setSelectedFacility({
            type: 'HOSPITAL',
            data: hosp
          });
        });

        markerGroup.addLayer(marker);
      });
    }

    // Add Pharmacies
    if (activeFilter === 'ALL' || activeFilter === 'PHARMACIES') {
      const filteredPharmacies = pharmacies.filter(p =>
        filterQuery === '' ||
        p.name.toLowerCase().includes(filterQuery) ||
        p.district.toLowerCase().includes(filterQuery) ||
        p.address.toLowerCase().includes(filterQuery)
      );

      filteredPharmacies.forEach(ph => {
        if (!ph.lat || !ph.lng) return;

        const icon = createIcon(
          'linear-gradient(135deg, #065F46 0%, #059669 100%)',
          '💊',
          '#FFFFFF'
        );

        const marker = L.marker([ph.lat, ph.lng], { icon });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 2px 4px;">
            <strong style="color: #065F46;">${ph.name}</strong><br/>
            <span>${ph.is24x7 ? '24x7 Open' : 'Open'}</span>
          </div>
        `, { direction: 'top', offset: [0, -18] });

        marker.on('click', () => {
          setSelectedFacility({
            type: 'PHARMACY',
            data: ph
          });
        });

        markerGroup.addLayer(marker);
      });
    }

    // Adjust view if markers exist
    const layers = markerGroup.getLayers();
    if (layers.length > 0 && filterQuery !== '') {
      map.fitBounds(markerGroup.getBounds().pad(0.2));
    }
  }, [hospitals, pharmacies, activeFilter, searchQuery, isMapReady]);

  // Recenter map button
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const center = getDistrictCenter();
    mapInstanceRef.current.setView(center, 12, { animate: true });
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="p-4 bg-white/95 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22819A]/10 text-[#22819A] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Interactive Health GIS Map</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#22819A]/15 text-[#22819A]">
                {userDistrict}
              </span>
            </h2>
            <p className="text-xs text-slate-500">Live spatial mapping of hospitals, emergency ICU beds, and 24x7 pharmacies</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#22819A] text-slate-800"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeFilter === 'ALL' ? 'bg-[#22819A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({hospitals.length + pharmacies.length})
            </button>
            <button
              onClick={() => setActiveFilter('HOSPITALS')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap transition ${
                activeFilter === 'HOSPITALS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HospIcon className="w-3.5 h-3.5" />
              <span>Hospitals ({hospitals.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('PHARMACIES')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap transition ${
                activeFilter === 'PHARMACIES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Pharmacies ({pharmacies.length})</span>
            </button>
          </div>

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
            title="Recenter Map"
            aria-label="Recenter map"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Canvas + Selected Facility Drawer */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md h-[400px] sm:h-[500px] lg:h-[600px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Legend Overlay */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-1 hidden sm:block">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span>Hospital (ICU / Emergency)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span>Pharmacy (Verified Stock)</span>
          </div>
        </div>

        {/* Floating Facility Detail Drawer */}
        {selectedFacility && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[500] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2.5 max-h-[80%] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  selectedFacility.type === 'HOSPITAL' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedFacility.type === 'HOSPITAL' ? 'GOVT / NABH HOSPITAL' : 'GOVT / JAN AUSHADHI PHARMACY'}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1 leading-snug">
                  {selectedFacility.data.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{selectedFacility.data.address}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedFacility(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            {selectedFacility.type === 'HOSPITAL' && selectedFacility.data.beds && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {selectedFacility.data.beds.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] truncate">{b.category}</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{b.availableBeds} free</span>
                  </div>
                ))}
              </div>
            )}

            {selectedFacility.type === 'PHARMACY' && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">24x7 Prescription Fulfillment</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-[10px]">
                  {selectedFacility.data.is24x7 ? '24x7 Verified' : 'Day Shift'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${selectedFacility.data.phone || selectedFacility.data.emergencyPhone}`}
                className="flex-1 px-3.5 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call ({selectedFacility.data.phone || selectedFacility.data.emergencyPhone})</span>
              </a>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.data.lat},${selectedFacility.data.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Navigation className="w-3.5 h-3.5 text-[#22819A]" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default InteractiveMap;
