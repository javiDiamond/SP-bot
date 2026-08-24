'use client';

import { useState } from 'react';

const GRID_TYPES = [
  { value: 'ARITHMETIC', label: 'Arithmetic (Equal Spacing)' },
  { value: 'GEOMETRIC', label: 'Geometric (Percentage Spacing)' },
];

const INVENTORY_MODES = [
  { value: 'EXISTING_ONLY', label: 'Use Existing Balance Only' },
  { value: 'AUTO_REBALANCE', label: 'Auto Rebalance (Requires Market Orders)' },
];

const RANGE_EXIT_BEHAVIORS = [
  { value: 'PAUSE_KEEP_ORDERS', label: 'Pause & Keep Orders' },
  { value: 'PAUSE_CANCEL_ALL', label: 'Pause & Cancel All' },
  { value: 'STOP_CANCEL_ALL', label: 'Stop & Cancel All' },
  { value: 'RECENTER', label: 'Recenter Grid' },
];

export default function NewBotPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: 'BTCUSDT',
    gridType: 'ARITHMETIC',
    lowerPrice: '',
    upperPrice: '',
    gridCount: '10',
    totalInvestmentQuote: '',
    inventoryMode: 'EXISTING_ONLY',
    onRangeExit: 'PAUSE_KEEP_ORDERS',
    minProfitAfterFeesBps: '10',
    makerOnly: true,
    autoRecenter: false,
  });

  const [gridPreview, setGridPreview] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: string[] = [];
    
    if (!formData.name) errors.push('Bot name is required');
    if (!formData.lowerPrice || parseFloat(formData.lowerPrice) <= 0) errors.push('Valid lower price is required');
    if (!formData.upperPrice || parseFloat(formData.upperPrice) <= 0) errors.push('Valid upper price is required');
    if (parseFloat(formData.lowerPrice) >= parseFloat(formData.upperPrice)) errors.push('Lower price must be less than upper price');
    if (!formData.gridCount || parseInt(formData.gridCount) < 2) errors.push('Grid count must be at least 2');
    if (!formData.totalInvestmentQuote || parseFloat(formData.totalInvestmentQuote) <= 0) errors.push('Valid investment amount is required');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Calculate grid preview
    const lower = parseFloat(formData.lowerPrice);
    const upper = parseFloat(formData.upperPrice);
    const count = parseInt(formData.gridCount);
    const step = (upper - lower) / count;
    
    const levels = [];
    for (let i = 0; i <= count; i++) {
      levels.push((lower + i * step).toFixed(2));
    }
    setGridPreview(levels);
    setValidationErrors([]);

    // In a real app, this would submit to the API
    console.log('Creating bot:', formData);
    alert('Bot creation would be submitted to API here. This is a demo.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Grid Bot</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your grid trading strategy
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong className="font-medium">Paper Trading: </strong>
              This bot will run in dry-run/paper mode. No real orders will be placed on Wallex Exchange.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bot Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="My First Grid Bot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Trading Pair</label>
              <select
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
                <option value="BTCTMN">BTC/TMN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Type</label>
              <select
                value={formData.gridType}
                onChange={(e) => setFormData({ ...formData, gridType: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              >
                {GRID_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Inventory Mode</label>
              <select
                value={formData.inventoryMode}
                onChange={(e) => setFormData({ ...formData, inventoryMode: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              >
                {INVENTORY_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid Parameters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grid Parameters</h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lower Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.lowerPrice}
                onChange={(e) => setFormData({ ...formData, lowerPrice: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upper Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.upperPrice}
                onChange={(e) => setFormData({ ...formData, upperPrice: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="70000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grid Count</label>
              <input
                type="number"
                min="2"
                max="100"
                value={formData.gridCount}
                onChange={(e) => setFormData({ ...formData, gridCount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Total Investment (Quote Asset)</label>
              <input
                type="number"
                step="0.01"
                value={formData.totalInvestmentQuote}
                onChange={(e) => setFormData({ ...formData, totalInvestmentQuote: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="1000"
              />
              <p className="mt-1 text-xs text-gray-500">Amount of quote asset (e.g., USDT) to allocate to this bot</p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Profit After Fees (bps)</label>
              <input
                type="number"
                min="0"
                value={formData.minProfitAfterFeesBps}
                onChange={(e) => setFormData({ ...formData, minProfitAfterFeesBps: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum profit in basis points after fees (100 bps = 1%)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Range Exit Behavior</label>
              <select
                value={formData.onRangeExit}
                onChange={(e) => setFormData({ ...formData, onRangeExit: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              >
                {RANGE_EXIT_BEHAVIORS.map((behavior) => (
                  <option key={behavior.value} value={behavior.value}>
                    {behavior.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.makerOnly}
                onChange={(e) => setFormData({ ...formData, makerOnly: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Maker Orders Only</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoRecenter}
                onChange={(e) => setFormData({ ...formData, autoRecenter: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Enable Auto Recenter</label>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <ul className="list-disc list-inside text-sm text-red-700">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Grid Preview */}
        {gridPreview.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grid Levels Preview</h3>
            <div className="grid grid-cols-5 gap-2">
              {gridPreview.map((level, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Level {index}</div>
                  <div className="font-mono text-sm">{level}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Bot (Dry Run)
          </button>
          <Link
            href="/dashboard/bots"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
