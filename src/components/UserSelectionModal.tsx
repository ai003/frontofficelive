import { User } from 'lucide-react';
import type { User as UserType } from '../App';
import { AVAILABLE_USERS } from '../App';

interface UserSelectionModalProps {
  onSelectUser: (user: UserType) => void;
}

export default function UserSelectionModal({ onSelectUser }: UserSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Pick a User
        </h2>
        
        <div className="flex justify-center gap-6">
          {AVAILABLE_USERS.map((user) => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors w-64 h-80 flex flex-col items-center justify-between"
            >
              {/* Large user icon at top */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
              
              {/* Username in middle */}
              <div className="flex-1 flex items-center justify-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                  {user.name}
                </h3>
              </div>
              
              {/* Role description at bottom */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-medium mb-2">
                    {user.role.toUpperCase()}
                  </span>
                  <br />
                  {user.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}