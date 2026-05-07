import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error: error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
          <div className="max-w-md text-center border border-red-500/30 bg-black/50 p-12 rounded-none">
            <div className="text-red-400 text-6xl mb-6">⚠</div>
            <h2 className="serif-font text-4xl italic text-white mb-4">Something Went Wrong</h2>
            <p className="text-white/70 mb-8">
              An unexpected error occurred while loading this section.<br />
              Please try refreshing the page.
            </p>
            <button 
              className="px-8 py-3 border border-[#d4af37] text-[#d4af37] text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all"
            >
              RELOAD PAGE
            </button>
            
            {this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-xs text-white/50 hover:text-white">Technical Details</summary>
                <pre className="mt-3 p-4 bg-black/50 text-red-400 text-xs overflow-auto max-h-40 rounded">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
