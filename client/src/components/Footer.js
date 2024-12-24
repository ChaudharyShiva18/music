// client/src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer className="mt-8 text-sm text-gray-500">
      &copy; {new Date().getFullYear()} My Music App. All rights reserved.
    </footer>
  );
}

export default Footer;
