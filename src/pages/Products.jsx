import React from 'react';
import Navbar from '../components/Navbar';

function Products() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar /> 
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold">Products List</h1>
        <p className="text-gray-400 mt-4">Product grid coming soon in PR-04!</p>
      </div>
    </div>
  );
}

export default Products;