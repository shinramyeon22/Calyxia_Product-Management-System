import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProduct() {
      const { data } = await supabase.from('product').select('*').eq('id', id).single();
      setProduct(data);
      setLoading(false);
    }
    getProduct();
  }, [id]);

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="boutique-detail-env">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400..900;1,400..900&family=Montserrat:wght@100;200;300;400;500&display=swap');

        .boutique-detail-env {
          background-color: #050505;
          color: #ffffff;
          min-height: 100vh;
          font-family: 'Montserrat', sans-serif;
        }

        /* --- NAVIGATION ALIGNMENT --- */
        .back-nav {
          padding: 10rem 0 2rem 10%;
        }

        .back-link {
          font-size: 0.65rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #d4af37;
          text-decoration: none;
          transition: 0.3s;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-link:hover { opacity: 0.6; }

        /* --- SPLIT EDITORIAL LAYOUT --- */
        .detail-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 80vh;
          align-items: center;
          padding: 0 5%;
          gap: 5%;
        }

        /* The Pedestal Visual */
        .detail-visual-pedestal {
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 10%;
          position: relative;
        }

        .detail-visual-pedestal img {
          width: 100%;
          height: auto;
          box-shadow: 0 80px 150px rgba(0,0,0,0.9);
          filter: contrast(1.05);
        }

        /* Information Pane */
        .detail-content {
          padding-right: 15%;
        }

        .detail-label {
          font-size: 0.7rem;
          letter-spacing: 0.6em;
          color: #d4af37;
          text-transform: uppercase;
          margin-bottom: 2rem;
          display: block;
        }

        .detail-title {
          font-family: 'Bodoni Moda', serif;
          font-size: clamp(3rem, 5vw, 6rem);
          font-weight: 300;
          font-style: italic;
          line-height: 1.1;
          margin-bottom: 3rem;
        }

        .detail-price {
          font-family: 'Bodoni Moda', serif;
          font-size: 2.8rem;
          color: #d4af37;
          margin-bottom: 3rem;
          display: block;
        }

        .detail-description {
          font-size: 1rem;
          font-weight: 200;
          line-height: 2.2;
          color: #999;
          margin-bottom: 4rem;
          max-width: 500px;
        }

        /* The Gold "Acquire" Button */
        .btn-acquire {
          display: inline-block;
          width: 100%;
          padding: 1.5rem;
          border: 1px solid #d4af37;
          background: transparent;
          color: #d4af37;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5em;
          cursor: pointer;
          transition: all 0.4s ease;
          text-align: center;
        }

        .btn-acquire:hover {
          background: #d4af37;
          color: #000;
          box-shadow: 0 0 50px rgba(212, 175, 55, 0.2);
        }

        /* Watermark Background */
        .watermark-text {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          font-family: 'Bodoni Moda', serif;
          font-size: 20vw;
          color: rgba(212, 175, 55, 0.02);
          pointer-events: none;
          z-index: -1;
        }
      `}</style>

      <Navbar />
      <div className="watermark-text">CC</div>

      <nav className="back-nav">
        <Link to="/products" className="back-link">
          ← Return to Catalog
        </Link>
      </nav>

      <main className="detail-main">
        <div className="detail-visual-pedestal">
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="detail-content">
          <span className="detail-label">Institutional Asset</span>
          <h1 className="detail-title">{product.name}</h1>
          <span className="detail-price">₱{product.price.toLocaleString()}</span>
          <p className="detail-description">{product.description}</p>
          
          <button className="btn-acquire">
            Acquire Piece
          </button>
        </div>
      </main>

      <footer className="py-20 text-center opacity-20">
        <p style={{fontSize: '0.6rem', letterSpacing: '0.6em'}}>CALYXIA PRIVATE COLLECTION — 2026</p>
      </footer>
    </div>
  );
}