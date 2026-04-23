import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .order('email', { ascending: true });

      if (error) throw error;

      console.log("Fetched Users:", data); // Check F12 console for this!
      setUsers(data || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(userId, currentStatus) {
    if (userId === currentAdmin?.id) {
      alert("Safety Check: You cannot deactivate yourself!");
      return;
    }

    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { error } = await supabase
      .from('app_user')
      .update({ record_status: newStatus })
      .eq('id', userId);

    if (error) {
      alert("Update failed: " + error.message);
    } else {
      fetchUsers();
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white">
      <Navbar /><div className="p-10">Loading user database...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <button onClick={fetchUsers} className="text-xs bg-gray-800 px-3 py-1 rounded hover:bg-gray-700">
            🔄 Refresh Table
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-900/20 border border-red-500 p-4 rounded mb-6 text-red-400">
            <strong>Database Error:</strong> {errorMsg}
          </div>
        )}

        {users.length === 0 && !errorMsg ? (
          <div className="bg-[#0f0f12] border border-dashed border-gray-800 p-10 text-center rounded-xl">
            <p className="text-gray-500">No users found. This usually means RLS is blocking the read.</p>
          </div>
        ) : (
          <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#1f1f23] text-gray-400 text-sm uppercase">
                <tr>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.user_type === 'ADMIN' ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-800 text-gray-400'}`}>
                        {u.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.record_status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {u.record_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(u.id, u.record_status)}
                        disabled={u.id === currentAdmin?.id}
                        className={`text-sm font-medium ${u.id === currentAdmin?.id ? 'text-gray-600' : 'text-indigo-400 hover:underline'}`}
                      >
                        {u.id === currentAdmin?.id ? 'Current Admin' : (u.record_status === 'ACTIVE' ? 'Deactivate' : 'Activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}