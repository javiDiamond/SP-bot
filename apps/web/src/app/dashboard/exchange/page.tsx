'use client';

export default function ExchangePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exchange Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your Wallex Exchange API credentials
        </p>
      </div>

      {/* Security Warning */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong className="font-medium">Security Notice: </strong>
              Never share your API keys. Create API keys with only Read and Trade permissions. 
              Do NOT enable withdrawal permissions. Your keys are encrypted at rest.
            </p>
          </div>
        </div>
      </div>

      {/* Empty State - No API Keys Configured */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No exchange account configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your Wallex API credentials to start trading.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Exchange Account
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">How to Get Your Wallex API Key</h3>
        <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
          <li>Log in to your Wallex Exchange account</li>
          <li>Navigate to Settings → API Management</li>
          <li>Click "Create New API Key"</li>
          <li>Enable only <strong>Read</strong> and <strong>Trade</strong> permissions</li>
          <li><strong className="text-red-600">DO NOT</strong> enable Withdrawal permissions</li>
          <li>Copy your API key and paste it below</li>
        </ol>
      </div>
    </div>
  );
}
