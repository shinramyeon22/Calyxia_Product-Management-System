import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { useRights } from '../context/UserRightsContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
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
          const { data } = await supabase.rpc('get_top_selling_products', { limit_count: 10 });
          setTopSelling(data || []);
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
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <div className="mb-12">
            <div className="text-[#d4af37] text-xs tracking-[0.5em]">ANALYTICS</div>
            <h1 className="serif-font text-7xl italic tracking-tighter mt-2">Reports</h1>
            <p className="text-white/50 mt-3 text-lg">Business intelligence & performance insights</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-8">
            {canViewProductReport && (
              <button
                onClick={() => setActiveTab('products')}
                className={`px-10 py-4 text-sm tracking-[0.3em] transition-all ${activeTab === 'products' ? 'border-b-2 border-[#d4af37] text-[#d4af37]' : 'text-white/50 hover:text-white'}`}
              >
                PRODUCT LISTING
              </button>
            )}
            {canViewTopSellingReport && (
              <button
                onClick={() => setActiveTab('topselling')}
                className={`px-10 py-4 text-sm tracking-[0.3em] transition-all ${activeTab === 'topselling' ? 'border-b-2 border-[#d4af37] text-[#d4af37]' : 'text-white/50 hover:text-white'}`}
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
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl serif-font italic">Top Selling Products</h2>
                    <p className="text-white/60">Top 10 products ranked by total quantity sold</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-3 border border-white/30 hover:bg-white/5 rounded-lg text-sm tracking-widest flex items-center gap-2"
                  >
                    ↻ Refresh
                  </button>
                </div>

                {topSelling.length > 0 ? (
                  <>
                    {topSelling[0] && (
                      <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-500/30 rounded-3xl p-8 flex items-center gap-6">
                        <div className="text-6xl">🏆</div>
                        <div>
                          <div className="text-emerald-400 text-sm tracking-[0.5em] uppercase">TOP SELLING PRODUCT</div>
                          <div className="text-4xl font-medium mt-1">{topSelling[0].description}</div>
                          <div className="text-emerald-400 font-mono mt-2">
                            {topSelling[0].prodcode} • {topSelling[0].unit}
                          </div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-6xl font-mono text-emerald-400">{topSelling[0].total_sold}</div>
                          <div className="text-sm text-emerald-400/70">units sold</div>
                        </div>
                      </div>
                    )}

                    <div className="border border-white/10 rounded-3xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-black/60 border-b border-white/10">
                          <tr className="text-xs tracking-widest text-white/60">
                            <th className="px-8 py-6 text-left">RANK</th>
                            <th className="px-8 py-6 text-left">PRODUCT</th>
                            <th className="px-8 py-6 text-center">UNIT</th>
                            <th className="px-8 py-6 text-right">TOTAL QTY SOLD</th>
                            <th className="px-8 py-6 text-left">VOLUME BAR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {topSelling.map((item, index) => (
                            <tr key={index} className="hover:bg-white/5 transition">
                              <td className="px-8 py-6 text-2xl font-mono text-[#d4af37]">#{index + 1}</td>
                              <td className="px-8 py-6">
                                <div className="font-medium">{item.description}</div>
                                <div className="text-xs text-white/50 font-mono">{item.prodcode}</div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <span className="px-4 py-1 bg-white/10 rounded-full text-xs uppercase">{item.unit}</span>
                              </td>
                              <td className="px-8 py-6 text-right font-mono text-lg text-emerald-400">
                                {item.total_sold}
                              </td>
                              <td className="px-8 py-6">
                                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 transition-all"
                                    style={{ width: `${Math.min((item.total_sold / (topSelling[0]?.total_sold || 1)) * 100, 100)}%` }}
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
                  <div className="text-center py-20 text-white/30">No sales data found.</div>
                )}
              </div>
            ) : activeTab === 'products' && canViewProductReport ? (
              <div className="border border-white/10 rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/60 border-b border-white/10">
                    <tr className="text-xs tracking-widest text-white/60">
                      <th className="px-8 py-6 text-left">PRODUCT CODE</th>
                      <th className="px-8 py-6 text-left">DESCRIPTION</th>
                      <th className="px-8 py-6 text-center">UNIT</th>
                      <th className="px-8 py-6 text-right">CURRENT PRICE</th>
                      <th className="px-8 py-6 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {products.map((p, index) => (
                      <tr key={index} className="hover:bg-white/5 transition">
                        <td className="px-8 py-5 font-mono text-[#d4af37]">{p.prodcode}</td>
                        <td className="px-8 py-5">{p.description}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-3 py-1 bg-white/5 rounded-full text-xs">{p.unit}</span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-[#d4af37]">
                          ₱{Number(p.current_price || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-4 py-1 text-xs rounded-full ${p.record_status === 'A' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {p.record_status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}