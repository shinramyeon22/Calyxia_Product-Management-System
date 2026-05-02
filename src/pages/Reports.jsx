import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { useRights } from '../context/UserRightsContext';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [acquisitions, setAcquisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRight } = useRights();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasRight('REP_VIEW')) {
      navigate('/products');
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const { data: prodData } = await supabase
          .from('product')
          .select('*')
          .eq('record_status', 'A')
          .order('price', { ascending: false });
        setProducts(prodData || []);

        try {
          const { data: acqData } = await supabase
            .from('acquisition')
            .select(`*, product:product_id (name, price)`)
            .order('acquired_at', { ascending: false })
            .limit(50);
          setAcquisitions(acqData || []);
        } catch {
          setAcquisitions([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [hasRight, navigate]);

  const topSelling = React.useMemo(() => {
    if (!acquisitions.length) return [];
    const counts = {};
    acquisitions.forEach(a => {
      const name = a.product?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [acquisitions]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-8 py-16">
          <div className="mb-12">
            <span className="text-[#d4af37] text-xs tracking-[0.5em]">INTELLIGENCE</span>
            <h1 className="serif-font text-6xl italic tracking-tighter">Reports & Analytics</h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-10">
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-8 py-4 text-xs tracking-widest transition ${activeTab === 'products' ? 'border-b-2 border-[#d4af37] text-[#d4af37]' : 'text-white/50 hover:text-white'}`}
            >
              PRODUCT REPORT
            </button>
            
            {/* TOP SELLING TAB - Only SUPERADMIN (REP_TOP) */}
            {hasRight('REP_TOP') && (
              <button 
                onClick={() => setActiveTab('topselling')}
                className={`px-8 py-4 text-xs tracking-widest transition ${activeTab === 'topselling' ? 'border-b-2 border-[#d4af37] text-[#d4af37]' : 'text-white/50 hover:text-white'}`}
              >
                TOP SELLING
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#d4af37] text-xs tracking-widest">GENERATING REPORT...</div>
          ) : activeTab === 'products' ? (
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-xs text-white/50">FULL INVENTORY LISTING</span>
                  <div className="text-2xl mt-1">Product Valuation Report</div>
                </div>
                <div className="text-xs text-white/50">Total Value: ₱{products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0).toLocaleString()}</div>
              </div>

              <div className="border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/60">
                    <tr className="text-xs tracking-widest text-white/60">
                      <th className="px-8 py-5 text-left">ID / CODE</th>
                      <th className="px-8 py-5 text-left">DESCRIPTION</th>
                      <th className="px-8 py-5">UNIT</th>
                      <th className="px-8 py-5 text-right">PRICE</th>
                      <th className="px-8 py-5 text-right">STOCK</th>
                      <th className="px-8 py-5 text-right">TOTAL VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="px-8 py-6 font-mono text-xs">{p.id}</td>
                        <td className="px-8 py-6">{p.name || p.description?.substring(0, 40)}</td>
                        <td className="px-8 py-6 text-center text-xs text-white/60">{p.unit}</td>
                        <td className="px-8 py-6 text-right text-[#d4af37]">₱{Number(p.price || 0).toLocaleString()}</td>
                        <td className="px-8 py-6 text-right font-mono">{p.stock || 0}</td>
                        <td className="px-8 py-6 text-right font-mono text-emerald-400">₱{((p.price || 0) * (p.stock || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <span className="text-xs text-white/50">ACQUISITION INTELLIGENCE</span>
                <div className="text-2xl mt-1">Top Selling Assets</div>
                <p className="text-white/60 text-sm mt-2">Based on recent acquisition records (last 50 transactions)</p>
              </div>

              {topSelling.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {topSelling.map((item, idx) => (
                    <div key={idx} className="border border-white/10 p-8 flex items-center gap-6">
                      <div className="text-6xl font-mono text-white/10">0{idx + 1}</div>
                      <div className="flex-1">
                        <div className="text-xl">{item.name}</div>
                        <div className="text-emerald-400 text-sm tracking-widest mt-1">{item.count} ACQUIRED</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-white/10 text-white/50">
                  No acquisition data available yet.<br />
                  <span className="text-xs">Acquire products via Product Details to generate insights.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}