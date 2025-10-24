"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const UNIT_TYPES = [
  { value: "SINGLE_ROOM", label: "Single Room" },
  { value: "BEDSITTER", label: "Bedsitter" },
  { value: "ONE_BEDROOM", label: "One Bedroom" },
  { value: "TWO_BEDROOM", label: "Two Bedroom" },
  { value: "THREE_BEDROOM", label: "Three Bedroom" },
  { value: "STUDIO", label: "Studio" },
  { value: "OTHER", label: "Other" },
];

const PHOTO_TAGS = [
  { value: "BEDROOM", label: "Bedroom" },
  { value: "LIVING_ROOM", label: "Living Room" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "TOILET", label: "Toilet" },
  { value: "BATHROOM", label: "Bathroom" },
  { value: "BALCONY", label: "Balcony" },
  { value: "COMPOUND", label: "Compound" },
  { value: "EXTERIOR", label: "Exterior" },
  { value: "PARKING", label: "Parking" },
  { value: "OTHER", label: "Other" },
];

export default function RegisterPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Property Details
  const [propertyName, setPropertyName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [createdProperty, setCreatedProperty] = useState<any>(null);

  // Step 2: Unit Details
  const [unitName, setUnitName] = useState("");
  const [unitType, setUnitType] = useState("ONE_BEDROOM");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [createdUnit, setCreatedUnit] = useState<any>(null);

  // Step 3: Photos with tags
  const [photoTag, setPhotoTag] = useState("BEDROOM");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);

  // Step 4: Occupancy Status
  const [occupancyStatus, setOccupancyStatus] = useState("VACANT");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/landlord/properties", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: propertyName,
          description,
          location,
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create property");

      setCreatedProperty(data);
      setMessage({ type: "success", text: "Property created! Now add a unit." });
      setStep(2);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!createdProperty) return;

    setBusy(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/landlord/properties/${createdProperty.id}/units`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: unitName,
          unitType,
          rent: parseInt(rent),
          deposit: deposit ? parseInt(deposit) : null,
          description: unitDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create unit");

      setCreatedUnit(data);
      setMessage({ type: "success", text: "Unit created! Now upload photos." });
      setStep(3);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadPhotos(e: React.FormEvent) {
    e.preventDefault();
    if (!createdUnit || !selectedFiles || selectedFiles.length === 0) {
      setMessage({ type: "error", text: "Please select photos" });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      let uploadedCount = 0;

      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("photoTag", photoTag);

        const res = await fetch(`/api/landlord/units/${createdUnit.id}/photos`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedPhotos((prev) => [...prev, data]);
          uploadedCount++;
        }
      }

      setMessage({ type: "success", text: `${uploadedCount} photo(s) uploaded for ${photoTag}` });
      setSelectedFiles(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleSetOccupancy(e: React.FormEvent) {
    e.preventDefault();
    if (!createdUnit) return;

    setBusy(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/landlord/units/${createdUnit.id}/occupancy`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ occupancyStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update occupancy");

      setMessage({ type: "success", text: "Unit registered successfully!" });
      setStep(5);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  function resetForNewUnit() {
    setUnitName("");
    setUnitType("ONE_BEDROOM");
    setRent("");
    setDeposit("");
    setUnitDescription("");
    setCreatedUnit(null);
    setUploadedPhotos([]);
    setOccupancyStatus("VACANT");
    setStep(2);
    setMessage(null);
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Register New Property</h1>
      <p className="text-slate-600 mb-6">
        Add your property and units to the ShimaHome platform
      </p>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {["Property", "Unit", "Photos", "Status"].map((label, idx) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                step > idx + 1
                  ? "bg-green-500 text-white"
                  : step === idx + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {step > idx + 1 ? "✓" : idx + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-slate-700">{label}</span>
            {idx < 3 && <div className="w-12 h-0.5 bg-slate-200 mx-2"></div>}
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`rounded-lg border p-4 mb-6 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Step 1: Property Details */}
      {step === 1 && (
        <form onSubmit={handleCreateProperty} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            <p className="text-sm text-slate-600 mb-6">
              Enter the main details of your property (e.g., "Onesmus Hostels")
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property Name *
            </label>
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g., Onesmus Hostels"
              className="w-full rounded-md border border-slate-300 px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Meru"
              className="w-full rounded-md border border-slate-300 px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Meru Town, Near Meru University"
              className="w-full rounded-md border border-slate-300 px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your property..."
              rows={4}
              className="w-full rounded-md border border-slate-300 px-4 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create Property & Continue"}
          </button>
        </form>
      )}

      {/* Step 2: Unit Details */}
      {step === 2 && createdProperty && (
        <form onSubmit={handleCreateUnit} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Add Unit to {createdProperty.name}</h2>
            <p className="text-sm text-slate-600 mb-6">
              Add a room/unit (e.g., "On 2" - One Bedroom)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Name/Tag *
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g., On 2"
                className="w-full rounded-md border border-slate-300 px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Type *
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-4 py-2"
              >
                {UNIT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Monthly Rent (KES) *
              </label>
              <input
                type="number"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                placeholder="e.g., 8000"
                className="w-full rounded-md border border-slate-300 px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deposit (KES)
              </label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="e.g., 8000"
                className="w-full rounded-md border border-slate-300 px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Unit Description
            </label>
            <textarea
              value={unitDescription}
              onChange={(e) => setUnitDescription(e.target.value)}
              placeholder="Describe this unit..."
              rows={3}
              className="w-full rounded-md border border-slate-300 px-4 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create Unit & Continue"}
          </button>
        </form>
      )}

      {/* Step 3: Upload Photos */}
      {step === 3 && createdUnit && (
        <div className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Upload Photos for {createdUnit.name}</h2>
            <p className="text-sm text-slate-600 mb-6">
              Upload photos for each part of the unit (bedroom, kitchen, toilet, compound, etc.)
            </p>
          </div>

          {uploadedPhotos.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-medium">
                ✓ {uploadedPhotos.length} photo(s) uploaded successfully
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(
                  uploadedPhotos.reduce((acc: any, photo) => {
                    acc[photo.photoTag] = (acc[photo.photoTag] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([tag, count]) => (
                  <span key={tag} className="text-xs bg-white px-2 py-1 rounded border border-green-300">
                    {tag}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleUploadPhotos} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Photo Category
              </label>
              <select
                value={photoTag}
                onChange={(e) => setPhotoTag(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-4 py-2"
              >
                {PHOTO_TAGS.map((tag) => (
                  <option key={tag.value} value={tag.value}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Photos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="w-full rounded-md border border-slate-300 px-4 py-2"
              />
              <p className="text-xs text-slate-500 mt-1">You can select multiple photos at once</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Uploading..." : "Upload Photos"}
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={uploadedPhotos.length === 0}
                className="flex-1 rounded-md bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Continue to Status
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Set Occupancy Status */}
      {step === 4 && createdUnit && (
        <form onSubmit={handleSetOccupancy} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Set Occupancy Status</h2>
            <p className="text-sm text-slate-600 mb-6">
              Is this unit currently vacant or occupied?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOccupancyStatus("VACANT")}
              className={`p-6 rounded-xl border-2 text-center ${
                occupancyStatus === "VACANT"
                  ? "border-green-500 bg-green-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-4xl mb-2">🏠</div>
              <div className="font-semibold">Vacant</div>
              <div className="text-sm text-slate-600 mt-1">Available for rent</div>
            </button>

            <button
              type="button"
              onClick={() => setOccupancyStatus("OCCUPIED")}
              className={`p-6 rounded-xl border-2 text-center ${
                occupancyStatus === "OCCUPIED"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-4xl mb-2">🔒</div>
              <div className="font-semibold">Occupied</div>
              <div className="text-sm text-slate-600 mt-1">Currently rented</div>
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Complete Registration"}
          </button>
        </form>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Unit Registered Successfully!</h2>
          <p className="text-slate-600 mb-6">
            {occupancyStatus === "VACANT"
              ? "Your unit will appear on the discovery feed for tenants to find."
              : "Your unit has been marked as occupied and won't appear in searches."}
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetForNewUnit}
              className="rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700"
            >
              Add Another Unit to {createdProperty?.name}
            </button>
            <button
              onClick={() => router.push("/landlord/dashboard")}
              className="rounded-md border border-slate-300 px-6 py-3 text-slate-700 font-medium hover:bg-slate-50"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
