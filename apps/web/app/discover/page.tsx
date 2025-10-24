"use client";

import { useState, useEffect } from "react";

interface UnitListing {
  id: string;
  name: string;
  unitType: string;
  rent: number;
  deposit: number | null;
  description: string | null;
  photos: Array<{
    id: string;
    photoTag: string;
    storageKey: string;
  }>;
  property: {
    id: string;
    name: string;
    location: string;
    address: string | null;
  };
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  SINGLE_ROOM: "Single Room",
  BEDSITTER: "Bedsitter",
  ONE_BEDROOM: "1 Bedroom",
  TWO_BEDROOM: "2 Bedrooms",
  THREE_BEDROOM: "3 Bedrooms",
  STUDIO: "Studio",
  OTHER: "Other",
};

export default function DiscoverPage() {
  const [listings, setListings] = useState<UnitListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<UnitListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [locationFilter, setLocationFilter] = useState("");
  const [unitTypeFilter, setUnitTypeFilter] = useState("");
  const [maxRentFilter, setMaxRentFilter] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, locationFilter, unitTypeFilter, maxRentFilter]);

  async function loadListings() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/discover", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...listings];

    if (locationFilter) {
      filtered = filtered.filter((unit) =>
        unit.property.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (unitTypeFilter) {
      filtered = filtered.filter((unit) => unit.unitType === unitTypeFilter);
    }

    if (maxRentFilter) {
      const maxRent = parseInt(maxRentFilter);
      filtered = filtered.filter((unit) => unit.rent <= maxRent);
    }

    setFilteredListings(filtered);
    setCurrentIndex(0);
  }

  function handleNext() {
    if (currentIndex < filteredListings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  const currentUnit = filteredListings[currentIndex];
  const coverPhoto = currentUnit?.photos.find((p) => p.photoTag === "EXTERIOR") || currentUnit?.photos[0];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading available homes...</p>
        </div>
      </main>
    );
  }

  if (filteredListings.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h1 className="text-2xl font-bold mb-2">No Homes Found</h1>
            <p className="text-slate-600 mb-6">
              {locationFilter || unitTypeFilter || maxRentFilter
                ? "No homes match your search criteria. Try adjusting your filters."
                : "No available homes at the moment. Check back soon!"}
            </p>
            <button
              onClick={() => {
                setLocationFilter("");
                setUnitTypeFilter("");
                setMaxRentFilter("");
                setShowFilters(false);
              }}
              className="rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Discover Your Next Home</h1>
            <p className="text-slate-600 mt-1">
              {filteredListings.length} available {filteredListings.length === 1 ? "home" : "homes"}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filter Your Search</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g., Meru, Mombasa"
                  className="w-full rounded-md border border-slate-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
                <select
                  value={unitTypeFilter}
                  onChange={(e) => setUnitTypeFilter(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-2"
                >
                  <option value="">All Types</option>
                  <option value="SINGLE_ROOM">Single Room</option>
                  <option value="BEDSITTER">Bedsitter</option>
                  <option value="ONE_BEDROOM">1 Bedroom</option>
                  <option value="TWO_BEDROOM">2 Bedrooms</option>
                  <option value="THREE_BEDROOM">3 Bedrooms</option>
                  <option value="STUDIO">Studio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Rent (KES)</label>
                <input
                  type="number"
                  value={maxRentFilter}
                  onChange={(e) => setMaxRentFilter(e.target.value)}
                  placeholder="e.g., 10000"
                  className="w-full rounded-md border border-slate-300 px-4 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        {currentUnit && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Image */}
            <div className="relative h-96 bg-slate-200">
              {coverPhoto ? (
                <img
                  src={`/api/files/${coverPhoto.storageKey}`}
                  alt={currentUnit.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-400">
                    <svg className="w-24 h-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <p>No photo</p>
                  </div>
                </div>
              )}

              {/* Photo Count Badge */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                📸 {currentUnit.photos.length} photos
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredListings.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{currentUnit.property.name}</h2>
                  <p className="text-lg text-slate-600 mt-1">Unit: {currentUnit.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-600">KES {currentUnit.rent.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">per month</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {currentUnit.property.location}
                </div>

                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  {UNIT_TYPE_LABELS[currentUnit.unitType]}
                </div>

                {currentUnit.deposit && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Deposit: KES {currentUnit.deposit.toLocaleString()}
                  </div>
                )}
              </div>

              {currentUnit.property.address && (
                <p className="text-slate-600 mb-4">
                  <span className="font-medium">Address:</span> {currentUnit.property.address}
                </p>
              )}

              {currentUnit.description && (
                <p className="text-slate-700 mb-6">{currentUnit.description}</p>
              )}

              {/* Photo Gallery Preview */}
              {currentUnit.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Photos</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {currentUnit.photos.slice(0, 8).map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={`/api/files/${photo.storageKey}`}
                          alt={photo.photoTag}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
                          {photo.photoTag.replace("_", " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Contact Landlord
                </button>
                <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-4 rounded-xl border-2 border-slate-200 transition-all">
                  Save for Later
                </button>
              </div>

              {/* Pagination */}
              <div className="text-center mt-6 text-slate-600">
                {currentIndex + 1} of {filteredListings.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
