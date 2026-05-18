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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>
      <Navbar />
      <div className="flex">
        <Sidebar />

        <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

          {/* Floating background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: '110px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.6), 0 0 0 4px rgba(99,102,241,0.12)' }} />
            <div style={{ position: 'absolute', top: '260px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.5)' }} />
            <div style={{ position: 'absolute', top: '180px', right: '14%', width: '6px', height: '6px', borderRadius: '50%', background: '#c7d2fe', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
            <div style={{ position: 'absolute', top: '60px', right: '12%', width: '120px', height: '120px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.30) 0%, rgba(139,92,246,0.12) 100%)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)', boxShadow: '0 8px 32px rgba(99,102,241,0.20)' }} />
            <div style={{ position: 'absolute', top: '140px', right: '20%', width: '70px', height: '70px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(165,180,252,0.10) 100%)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', transform: 'rotate(-12deg)', boxShadow: '0 4px 20px rgba(99,102,241,0.15)' }} />
          </div>

          {/* Header */}
          <div className="mb-10 relative">
            <span className="text-xs tracking-[0.4em] font-semibold block mb-2 uppercase" style={{ color: '#a5b4fc' }}>Analytics</span>
            <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter leading-tight" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              Reports
            </h1>
            <p className="mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Business intelligence &amp; performance insights</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-10 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {canViewTopSellingReport && (
              <button
                onClick={() => setActiveTab('topselling')}
                className={`px-8 py-3 text-xs tracking-wider font-semibold transition-all ${activeTab === 'topselling' ? 'border-b-2 border-[#6366f1]' : ''}`}
                style={{ color: activeTab === 'topselling' ? '#a5b4fc' : 'rgba(255,255,255,0.35)', background: 'none', border: activeTab === 'topselling' ? undefined : 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (activeTab !== 'topselling') e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { if (activeTab !== 'topselling') e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
              >
                Top Selling
              </button>
            )}
          </div>

          {/* Content */}
          <div className="pb-12 relative">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="text-xs tracking-[0.4em] animate-pulse uppercase" style={{ color: '#a5b4fc' }}>Loading report...</div>
              </div>
            ) : activeTab === 'topselling' && canViewTopSellingReport ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl serif-font italic" style={{ color: 'rgba(255,255,255,0.9)' }}>Top Selling Products</h2>
                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Top 10 products ranked by total quantity sold</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: '14px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(8px)', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    ↻ Refresh
                  </button>
                </div>

                {topSelling.length > 0 ? (
                  <>
                    {/* Hero Card */}
                    {topSelling[0] && (
                      <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8" style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        boxShadow: '0 12px 40px rgba(16,185,129,0.08)'
                      }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.20)' }}>🏆</div>
                        <div>
                          <div className="text-[10px] tracking-[0.4em] uppercase font-bold mb-1" style={{ color: '#34d399' }}>Market Leader</div>
                          <div className="text-2xl font-semibold serif-font italic" style={{ color: 'rgba(255,255,255,0.9)' }}>{topSelling[0].description}</div>
                          <div className="font-mono mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Code: {topSelling[0].prodcode} · Unit: {topSelling[0].unit || 'PCS'}
                          </div>
                        </div>
                        <div className="md:ml-auto text-center md:text-right">
                          <div className="text-6xl font-mono leading-none font-bold" style={{ color: '#34d399' }}>{topSelling[0].totalqty}</div>
                          <div className="text-[10px] tracking-wider uppercase mt-1" style={{ color: 'rgba(52,211,153,0.7)' }}>Total Units Sold</div>
                        </div>
                      </div>
                    )}

                    {/* Table */}
                    <div className="overflow-hidden rounded-2xl" style={{
                      background: 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)',
                    }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} className="text-[10px] tracking-wider uppercase font-semibold">
                            <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Rank</th>
                            <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Product Details</th>
                            <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Unit</th>
                            <th className="px-6 py-4 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Volume</th>
                            <th className="px-6 py-4 text-left pl-10" style={{ color: 'rgba(255,255,255,0.35)' }}>Market Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSelling.map((item, index) => (
                            <tr
                              key={index}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td className="px-6 py-5 text-xl font-mono font-bold" style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                              }}>#{index + 1}</td>
                              <td className="px-6 py-5">
                                <div className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.description}</div>
                                <div className="text-[10px] font-mono tracking-tight uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.prodcode}</div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                                  {item.unit || 'PCS'}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right font-mono text-lg font-semibold" style={{ color: '#34d399' }}>
                                {item.totalqty.toLocaleString()}
                              </td>
                              <td className="px-6 py-5 pl-10 min-w-[180px]">
                                <div className="h-1.5 rounded-full overflow-hidden max-w-[140px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
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
                  <div className="text-center py-24 rounded-2xl" style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.10)'
                  }}>
                    <div className="text-xs tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>No sales data captured</div>
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
