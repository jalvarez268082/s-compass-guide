import React from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Bereavement Compass" }) => {
  const { currentUser, signOut, isAuthenticated } = useStore();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    const success = await signOut();
    if (success) {
      navigate('/auth');
    }
  };
  
  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-white hover:text-white/90">
          <h1 className="text-2xl font-bold">{title}</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center text-sm mr-2">
              <UserCircle className="mr-1 h-4 w-4" />
              <span>
                {currentUser.email}
                {currentUser.role === 'admin' && (
                  <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            {!isAuthenticated ? (
              <>
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-primary hover:bg-gray-100"
                  asChild
                >
                  <Link to="/auth?tab=signup">Sign Up</Link>
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white text-primary hover:bg-gray-100"
                onClick={handleSignOut}
              >
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
