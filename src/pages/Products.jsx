import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom'; 

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      // Logic remains untouched as requested
      const { data } = await supabase.from('product').select('*');
      setProducts(data || []);
      setLoading(false);
    }
    getProducts();
  }, []);

  return (
    <div className="calyxia-boutique-env">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400..900;1,400..900&family=Montserrat:wght@100;200;300;400;500&display=swap');

        /* Global Boutique Styling */
        .calyxia-boutique-env {
          background-color: #050505;
          color: #ffffff;
          min-height: 100vh;
          font-family: 'Montserrat', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* --- ELEGANT HEADER --- */
        .boutique-hero {
          padding-top: 12rem;
          padding-bottom: 6rem;
          text-align: center;
          background: radial-gradient(circle at center, #0d1a15 0%, #050505 100%);
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .hero-label {
          font-size: 0.65rem;
          letter-spacing: 0.8em;
          text-transform: uppercase;
          color: #d4af37;
          margin-bottom: 1.5rem;
          display: block;
          font-weight: 300;
        }

        .hero-main-title {
          font-family: 'Bodoni Moda', serif;
          font-size: clamp(3rem, 10vw, 7rem);
          font-style: italic;
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        /* --- THE EDITORIAL SHOWCASE --- */
        .showroom-flow {
          max-width: 1600px;
          margin: 0 auto;
          padding: 8rem 2rem;
        }

        .piece-container {
          display: flex;
          align-items: center;
          gap: 5%;
          margin-bottom: 18rem;
          position: relative;
        }

        .piece-container:nth-child(even) {
          flex-direction: row-reverse;
        }

        /* The Visual Pedestal */
        .piece-visual {
          flex: 1.2;
          background: #0a0a0a;
          padding: 4rem;
          border: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .piece-visual img {
          width: 100%;
          height: 650px;
          object-fit: contain;
          box-shadow: 0 80px 150px rgba(0,0,0,0.9);
          transition: transform 0.8s ease;
        }

        .piece-container:hover .piece-visual img {
          transform: scale(1.03);
        }

        /* Piece Information Pane */
        .piece-info {
          flex: 0.8;
          padding: 0 2rem;
        }

        .piece-number {
          font-size: 0.6rem;
          letter-spacing: 0.4em;
          color: #666;
          margin-bottom: 2rem;
          display: block;
        }

        .piece-name {
          font-family: 'Bodoni Moda', serif;
          font-size: 4rem;
          font-weight: 400;
          line-height: 1.1;
          margin-bottom: 2.5rem;
        }

        .piece-description {
          font-size: 0.95rem;
          font-weight: 200;
          line-height: 2.2;
          color: #999;
          margin-bottom: 3.5rem;
          max-width: 420px;
        }

        .piece-price {
          font-family: 'Bodoni Moda', serif;
          font-size: 2.4rem;
          color: #d4af37;
          display: block;
          margin-bottom: 4rem;
        }

        /* Acquisition Link */
        .piece-action {
          display: inline-block;
          padding: 1.4rem 4.5rem;
          border: 1px solid #d4af37;
          color: #d4af37;
          text-decoration: none;
          font-size: 0.7rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          transition: all 0.4s ease;
        }

        .piece-action:hover {
          background: #d4af37;
          color: #000;
          box-shadow: 0 0 40px rgba(212, 175, 55, 0.2);
        }

        /* Watermark */
        .boutique-watermark {
          position: fixed;
          bottom: 2rem;
          left: 2rem;
          font-family: 'Bodoni Moda', serif;
          font-size: 15vw;
          color: rgba(212, 175, 55, 0.02);
          pointer-events: none;
          z-index: 0;
          line-height: 0.8;
        }
      `}</style>

      <Navbar />
      
      <div className="boutique-watermark">CX</div>

      <header className="boutique-hero">
        <span className="hero-label">The Private Collection</span>
        <h1 className="hero-main-title">Calyxia Collections</h1>
      </header>

      <main className="showroom-flow">
        {loading ? (
          <div className="flex flex-col items-center py-40">
            <div className="w-12 h-[1px] bg-amber-500 animate-pulse mb-4"></div>
            <p style={{fontSize: '0.6rem', letterSpacing: '0.5em', opacity: 0.5}}>CURATING ASSETS</p>
          </div>
        ) : (
          products.map((p, index) => (
            <section key={p.id} className="piece-container">
              <div className="piece-visual">
                <img 
                  src={p.image_url || 'https://via.placeholder.com/800x1000/000000/FFFFFF?text=Asset+Processing'} 
                  alt={p.name} 
                />
              </div>

              <div className="piece-info">
                <span className="piece-number">SELECTION NO. 0{index + 1}</span>
                <h2 className="piece-name">{p.name}</h2>
                <p className="piece-description">{p.description}</p>
                <span className="piece-price">₱{p.price.toLocaleString()}</span>
                
                <Link to={`/product/${p.id}`} className="piece-action">
                  Explore Piece
                </Link>
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="py-32 text-center border-t border-white/5">
        <p style={{fontSize: '0.6rem', letterSpacing: '0.6em', opacity: 0.3, textTransform: 'uppercase'}}>
          Calyxia Institutional — 2026
        </p>
      </footer>
    </div>
  );
}