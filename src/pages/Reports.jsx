import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { useRights } from '../context/UserRightsContext'; // Double check if it's useRights or userRights
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('products');
  const [setProducts] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(true);

    const { hasRight } = useRights();
    const navigate = useNavigate();
    const { isSidebarOpen } = useSidebar();

    const canViewProductReport = hasRight('REP_001');
    const canViewTopSellingReport = hasRight('REP_002');

    useEffect(() => {
      if (!canViewProductReport && !canViewTopSellingReport) {
        navigate('/products');
        return;
      }

      async function fetchData() {
        setLoading(true);
        try {
          if (activeTab === 'products' && canViewProductReport) {
            const { data } = await supabase
              .from('product')
              .select('*')
              .eq('record_status', 'A')
              .order('id', { ascending: true });
            setProducts(data || []);
          }

          if (activeTab === 'topselling' && canViewTopSellingReport) {
            const { data, error } = await supabase
    .from('top_selling_products')
    .select('*')
    .order('totalqty', { ascending: false }) // Sort by highest quantity
    .limit(10);

  if (error) {
    console.error('Supabase Error:', error.message);
  } else {
    setTopSelling(data || []);
  }
}

        } catch (err) {
          console.error('Failed to load reports:', err);
        } finally {
          setLoading(false);
        }
      }

      fetchData();
    }, [activeTab, canViewProductReport, canViewTopSellingReport, navigate]);

    return (
  <div className="min-h-screen bg-[#050505] text-white">
    <Navbar />
    <div className="flex">
      <Sidebar />
      
      {/* Unified Layout Container: Standardized Spacing */}
      <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-[#d4af37] text-xs tracking-[0.5em] block mb-2">ANALYTICS</div>
          {/* Matched Header Size to text-6xl md:text-7xl */}
          <h1 className="serif-font text-6xl md:text-7xl italic tracking-tighter leading-tight">
            Reports
          </h1>
          <p className="text-white/50 mt-4 text-lg">Business intelligence & performance insights</p>
        </div>

        {/* Tabs - Styled to match the premium aesthetic */}
        <div className="flex border-b border-white/10 mb-12">
          {canViewTopSellingReport && (
            <button
              onClick={() => setActiveTab('topselling')}
              className={`px-10 py-4 text-xs tracking-[0.3em] transition-all font-medium ${
                activeTab === 'topselling' 
                ? 'border-b-2 border-[#d4af37] text-[#d4af37]' 
                : 'text-white/30 hover:text-white'
              }`}
            >
              TOP SELLING
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="pb-20">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="text-[#d4af37] text-xs tracking-[0.5em] animate-pulse">LOADING REPORT...</div>
            </div>
          ) : activeTab === 'topselling' && canViewTopSellingReport ? (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl serif-font italic">Top Selling Products</h2>
                  <p className="text-white/60 mt-2">Top 10 products ranked by total quantity sold</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 border border-white/20 hover:bg-white/5 rounded-lg text-[10px] tracking-widest uppercase transition-all"
                >
                  ↻ Refresh Data
                </button>
              </div>

              {topSelling.length > 0 ? (
                <>
                  {/* Hero Stat Card */}
                  {topSelling[0] && (
                    <div className="bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/20 rounded-2xl p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                      <div className="text-7xl">🏆</div>
                      <div>
                        <div className="text-emerald-400 text-[10px] tracking-[0.5em] uppercase mb-2">Market Leader</div>
                        <div className="text-4xl font-medium serif-font italic">{topSelling[0].description}</div>
                        <div className="text-white/40 font-mono mt-2 text-sm">
                          CODE: {topSelling[0].prodcode} • UNIT: {topSelling[0].unit || 'PCS'}
                        </div>
                      </div>
                      <div className="md:ml-auto text-center md:text-right">
                        <div className="text-7xl font-mono text-emerald-400 leading-none">{topSelling[0].totalqty}</div>
                        <div className="text-[10px] tracking-widest text-emerald-400/50 uppercase mt-2">Total Units Sold</div>
                      </div>
                    </div>
                  )}

                  {/* Top Sellers Table */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40 shadow-2xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black/70 border-b border-white/10 text-[10px] tracking-[0.2em] text-white/60 uppercase">
                          <th className="px-8 py-5 text-left">Rank</th>
                          <th className="px-8 py-5 text-left">Product Details</th>
                          <th className="px-8 py-5 text-center">Unit</th>
                          <th className="px-8 py-5 text-right">Volume</th>
                          <th className="px-8 py-5 text-left pl-12">Market Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {topSelling.map((item, index) => (
                          <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-6 text-2xl font-mono text-[#d4af37]">#{index + 1}</td>
                            <td className="px-8 py-6">
                              <div className="text-white/90 font-medium">{item.description}</div>
                              <div className="text-[10px] text-white/30 font-mono tracking-tighter uppercase">{item.prodcode}</div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase tracking-widest text-white/60">
                                {item.unit || 'PCS'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right font-mono text-lg text-emerald-400/90">
                              {item.totalqty.toLocaleString()}
                            </td>
                            <td className="px-8 py-6 pl-12 min-w-[200px]">
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[150px]">
                                <div 
                                  className="h-full bg-emerald-500/60 transition-all duration-1000"
                                  style={{ width: `${Math.min((item.totalqty / (topSelling[0]?.totalqty || 1)) * 100, 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl">
                  <div className="text-white/20 text-xs tracking-[0.5em]">NO SALES DATA CAPTURED</div>
                </div>
              )}
            </div>
          ) : activeTab === 'products' && canViewProductReport ? (
            <div className="text-white/30 text-xs tracking-widest italic text-center py-20">
              Generating asset inventory data...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  </div>
);
  }