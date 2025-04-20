
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Bereavement Compass" }) => {
  const { currentUser, toggleAdminEditMode, isAdminEditMode } = useStore();
  
  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        
        <div className="flex items-center gap-4">
          {currentUser?.role === 'admin' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="admin-mode"
                checked={isAdminEditMode}
                onCheckedChange={toggleAdminEditMode}
              />
              <Label htmlFor="admin-mode" className="text-white">
                Admin Mode
              </Label>
            </div>
          )}
          
          <div className="flex gap-2">
            {!currentUser ? (
              <>
                <Button variant="secondary" size="sm">Sign In</Button>
                <Button variant="outline" size="sm" className="bg-white text-primary hover:bg-gray-100">
                  Sign Up
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="bg-white text-primary hover:bg-gray-100">
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
