'use client';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          System configuration and risk controls
        </p>
      </div>

      {/* Live Trading Warning */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong className="font-medium">Live Trading Disabled: </strong>
              Live trading is currently disabled by environment configuration. To enable live trading, 
              set ENABLE_LIVE_TRADING=true in your environment variables and acknowledge the risks.
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-gray-50 px-4 py-3 rounded-md">
            <dt className="text-sm font-medium text-gray-500">Trading Mode</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                DRY RUN / PAPER TRADING
              </span>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-3 rounded-md">
            <dt className="text-sm font-medium text-gray-500">Environment</dt>
            <dd className="mt-1 text-sm text-gray-900">Development</dd>
          </div>
          <div className="bg-gray-50 px-4 py-3 rounded-md">
            <dt className="text-sm font-medium text-gray-500">Kill Switch</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Inactive
              </span>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-3 rounded-md">
            <dt className="text-sm font-medium text-gray-500">WebSocket Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Risk Limits */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Global Risk Limits</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Bots (Global)</label>
            <input
              type="number"
              defaultValue={10}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Daily Loss (%)</label>
            <input
              type="number"
              step="0.01"
              defaultValue={5}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Quote Exposure (Global)</label>
            <input
              type="number"
              defaultValue={100000}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Controls</h3>
        <div className="space-y-4">
          <button
            type="button"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Activate Kill Switch (Stop All Bots)
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel All Open Orders
          </button>
        </div>
      </div>
    </div>
  );
}
