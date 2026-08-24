'use client';

export default function BalancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Balances</h2>
        <p className="mt-1 text-sm text-gray-500">
          View your account balances
        </p>
      </div>

      {/* Paper Trading Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong className="font-medium">Paper Balances: </strong>
              These are simulated balances for dry-run mode. They do not reflect your actual Wallex account.
            </p>
          </div>
        </div>
      </div>

      {/* Sample Balances */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Paper Account Balances</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Locked
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">USDT</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10,000.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10,000.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">TMN</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,000,000,000.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,000,000,000.00</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">BTC</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00000000</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00000000</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00000000</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ETH</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00000000</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00000000</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00000000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
