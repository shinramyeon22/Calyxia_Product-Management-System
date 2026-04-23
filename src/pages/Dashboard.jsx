import React from 'react';
import { FiArrowUp, FiActivity, FiMoreVertical } from 'react-icons/fi';
import './Dashboard.css'; 

export default function Dashboard() {
  return (
    <div className="dash-root">
      <header className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
      </header>

      {/* Top 4 Stat Cards */}
      <div className="dash-stats-grid">
        <StatCard label="Total Projects" value="12" delta="+2" color="#6d5dff" />
        <StatCard label="Active Tasks" value="48" delta="+5" color="#10b981" />
        <StatCard label="Reports" value="256" delta="-12" color="#f59e0b" />
        <StatCard label="Users" value="1,284" delta="+18" color="#3b82f6" />
      </div>

      <div className="dash-charts-row">
        {/* Project Activity Chart Area */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Project Activity</span>
            <button className="dash-card-more"><FiMoreVertical /></button>
          </div>
          <div className="dash-chart-area">
             <div style={{height: '140px', background: 'linear-gradient(to bottom, #6d5dff15, transparent)', borderBottom: '2px solid #6d5dff', borderRadius: '8px'}}></div>
          </div>
        </div>

        {/* Donut Chart Area */}
        <div className="dash-card">
          <div className="dash-card-header"><span className="dash-card-title">Task Distribution</span></div>
          <div className="dash-donut-wrap">
            <div className="dash-donut-svg" style={{border: '12px solid #6d5dff', borderRadius: '50%', borderLeftColor: '#e2e8f0'}}></div>
            <div className="dash-donut-center">
              <span className="dash-donut-total">85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="dash-card dash-table-card">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>User</th><th>Action</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><div className="dash-table-user"><div className="dash-table-avatar">JD</div> Jane Doe</div></td>
                <td>Updated Project</td>
                <td><span className="dash-badge dash-badge--active">Active</span></td>
                <td className="dash-table-time">2 mins ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, delta, color }) => (
  <div className="dash-stat-card" style={{ '--card-accent': color }}>
    <div className="dash-stat-header">
      <div className="dash-stat-icon"><FiActivity /></div>
      <span className="dash-stat-label">{label}</span>
    </div>
    <div className="dash-stat-value">{value}</div>
    <div className="dash-stat-delta is-up"><FiArrowUp /> {delta}</div>
  </div>
);