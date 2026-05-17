import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { useRights } from '../context/UserRightsContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('topselling');
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
            .order('totalqty', { ascending: false })
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
    <div className="min-h-screen bg-[#f8faff]">
      <Navbar />
      <div className="flex">
        <Sidebar />

        <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

          {/* Header */}
          <div className="mb-10">
            <div className="text-[#6366f1] text-xs tracking-[0.4em] font-semibold block mb-2 uppercase">Analytics</div>
            <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter leading-tight text-[#1e1b4b]">
              Reports
            </h1>
            <p className="text-slate-400 mt-2">Business intelligence & performance insights</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-10">
            {canViewTopSellingReport && (
              <button
                onClick={() => setActiveTab('topselling')}
                className={`px-8 py-3 text-xs tracking-wider transition-all font-semibold ${
                  activeTab === 'topselling'
                    ? 'border-b-2 border-[#6366f1] text-[#6366f1]'
                    : 'text-slate-400 hover:text-[#1e1b4b]'
                }`}
              >
                Top Selling
              </button>
            )}
          </div>

          {/* Content */}
          <div className="pb-12">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="text-[#6366f1] text-xs tracking-[0.4em] animate-pulse uppercase">Loading report...</div>
              </div>
            ) : activeTab === 'topselling' && canViewTopSellingReport ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl serif-font italic text-[#1e1b4b]">Top Selling Products</h2>
                    <p className="text-slate-400 mt-1 text-sm">Top 10 products ranked by total quantity sold</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all text-slate-600"
                  >
                    ↻ Refresh
                  </button>
                </div>

                {topSelling.length > 0 ? (
                  <>
                    {/* Hero Card */}
                    {topSelling[0] && (
                      <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
                        <div>
                          <div className="text-emerald-600 text-[10px] tracking-[0.4em] uppercase font-bold mb-1">Market Leader</div>
                          <div className="text-2xl font-semibold serif-font italic text-[#1e1b4b]">{topSelling[0].description}</div>
                          <div className="text-slate-400 font-mono mt-1 text-xs">
                            Code: {topSelling[0].prodcode} · Unit: {topSelling[0].unit || 'PCS'}
                          </div>
                        </div>
                        <div className="md:ml-auto text-center md:text-right">
                          <div className="text-6xl font-mono text-emerald-600 leading-none font-bold">{topSelling[0].totalqty}</div>
                          <div className="text-[10px] tracking-wider text-emerald-500 uppercase mt-1">Total Units Sold</div>
                        </div>
                      </div>
                    )}

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                            <th className="px-6 py-4 text-left">Rank</th>
                            <th className="px-6 py-4 text-left">Product Details</th>
                            <th className="px-6 py-4 text-center">Unit</th>
                            <th className="px-6 py-4 text-right">Volume</th>
                            <th className="px-6 py-4 text-left pl-10">Market Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {topSelling.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-5 text-xl font-mono text-[#6366f1] font-bold">#{index + 1}</td>
                              <td className="px-6 py-5">
                                <div className="font-medium text-[#1e1b4b]">{item.description}</div>
                                <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase mt-0.5">{item.prodcode}</div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] uppercase tracking-wider text-slate-500">
                                  {item.unit || 'PCS'}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right font-mono text-lg text-emerald-600 font-semibold">
                                {item.totalqty.toLocaleString()}
                              </td>
                              <td className="px-6 py-5 pl-10 min-w-[180px]">
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[140px]">
                                  <div
                                    className="h-full bg-emerald-400 transition-all duration-700 rounded-full"
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
                  <div className="text-center py-24 border border-dashed border-slate-200 rounded-2xl bg-white">
                    <div className="text-slate-400 text-xs tracking-[0.4em] uppercase">No sales data captured</div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
