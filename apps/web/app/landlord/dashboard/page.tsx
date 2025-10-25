"use client";

import { useRouter } from "next/navigation";

export default function LandlordDashboardPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Landlord Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your properties and units</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Register Property Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2">Register Property</h2>
            <p className="text-slate-600 mb-4">
              Add a new property and units to your portfolio
            </p>
            <button
              onClick={() => router.push("/landlord/properties/register")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Add Property
            </button>
          </div>

          {/* View Properties Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">My Properties</h2>
            <p className="text-slate-600 mb-4">
              View and manage your registered properties
            </p>
            <button
              disabled
              className="w-full bg-slate-300 text-slate-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-xl font-semibold mb-2">Profile</h2>
            <p className="text-slate-600 mb-4">
              Update your landlord profile and verification
            </p>
            <button
              onClick={() => router.push("/landlord/onboarding")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              View Profile
            </button>
          </div>

          {/* Analytics Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-slate-600 mb-4">
              View property performance and occupancy rates
            </p>
            <button
              disabled
              className="w-full bg-slate-300 text-slate-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Messages Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">Messages</h2>
            <p className="text-slate-600 mb-4">
              Chat with tenants and manage inquiries
            </p>
            <button
              disabled
              className="w-full bg-slate-300 text-slate-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <p className="text-slate-600 mb-4">
              Manage account settings and preferences
            </p>
            <button
              disabled
              className="w-full bg-slate-300 text-slate-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <p className="text-sm text-slate-600">Total Properties</p>
            <p className="text-2xl font-bold text-indigo-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <p className="text-sm text-slate-600">Total Units</p>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <p className="text-sm text-slate-600">Vacant Units</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <p className="text-sm text-slate-600">Occupied Units</p>
            <p className="text-2xl font-bold text-orange-600">0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
