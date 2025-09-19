import React from 'react';
import { User, Mail, LogOut, Settings } from 'lucide-react';

const UserProfile = ({ user, onLogout }) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-3">
      {/* User Avatar */}
      <div className="relative">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name || user.email}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.email}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onLogout}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
