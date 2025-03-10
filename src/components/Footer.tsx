
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-6 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md">
      <div className="container mx-auto flex justify-center items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          2025 &copy; PDFlexo. All rights reserved. Powered by <span className="font-medium text-blue-600 dark:text-blue-400">in4metrix</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
