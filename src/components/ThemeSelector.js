import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';

const ThemeSelector = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
      gradient: 'from-yellow-400 to-orange-500',
      preview: 'bg-white border-gray-200'
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes',
      icon: Moon,
      gradient: 'from-blue-500 to-purple-600',
      preview: 'bg-gray-800 border-gray-700'
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follows your device setting',
      icon: Monitor,
      gradient: 'from-gray-500 to-gray-700',
      preview: 'bg-gradient-to-r from-white to-gray-800'
    }
  ];

  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem('ecoatlas-theme');
    if (!savedTheme) return 'system';
    return savedTheme;
  };

  const handleThemeChange = (themeId) => {
    if (themeId === 'system') {
      localStorage.removeItem('ecoatlas-theme');
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark !== isDarkMode) {
        toggleTheme();
      }
    } else {
      localStorage.setItem('ecoatlas-theme', themeId);
      const shouldBeDark = themeId === 'dark';
      if (shouldBeDark !== isDarkMode) {
        toggleTheme();
      }
    }
  };

  const currentTheme = getCurrentTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Customize how EcoAtlas looks and feels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentTheme === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => handleThemeChange(option.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}

              {/* Theme preview */}
              <div className={`w-full h-16 rounded-lg mb-3 ${option.preview} border flex items-center justify-center`}>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${option.gradient} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Theme info */}
              <div className="text-left">
                <h4 className={`font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                  {option.name}
                </h4>
                <p className={`text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current theme info */}
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Current theme: {currentTheme === 'system' ? 'System' : currentTheme === 'dark' ? 'Dark' : 'Light'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentTheme === 'system' 
                ? 'Following your device\'s appearance setting'
                : `Using ${currentTheme} mode`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Theme tips */}
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Theme Tips</h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Dark mode reduces eye strain in low light</li>
          <li>• Light mode provides better readability in bright environments</li>
          <li>• System mode automatically switches based on your device settings</li>
        </ul>
      </div>
    </div>
  );
};

export default ThemeSelector;
