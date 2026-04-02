import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-navy/80 backdrop-blur-md border-b border-teal/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <Activity className="w-8 h-8 text-teal group-hover:scale-110 transition-transform" />
            <span className="text-white font-sora font-bold text-xl">MediAudit</span>
          </Link>

          <div className="flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/')
                  ? 'bg-teal/20 text-teal'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/audit"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/audit')
                  ? 'bg-teal/20 text-teal'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Audit
            </Link>
            <Link
              to="/history"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/history')
                  ? 'bg-teal/20 text-teal'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
