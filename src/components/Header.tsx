import ThemeToggle from './ThemeToggle';

// Header component with Hacker News-inspired blue header styling
// Displays the site logo and title in a clean, professional layout
export default function Header() {
  return (
    <header className="w-full py-3 px-4 bg-blue-500 dark:bg-blue-700">
      {/* Container to constrain header content to max-width and center it */}
      <div className="flex items-center justify-between max-w-4xl mx-auto text-white">
        <div className="flex items-center gap-4">
        {/* Logo container with fixed dimensions */}
        <div className="h-8 w-8 overflow-hidden rounded">
          <img 
            src="/frontofficeLogo.png" 
            alt="FrontOffice.live Logo" 
            className="h-full w-full object-contain"
            style={{ maxHeight: '32px', maxWidth: '32px' }}
          />
        </div>
        
          {/* Site title with clean typography */}
          <h1 className="text-xl font-semibold text-white">
            FrontOffice.live
          </h1>
        </div>
        
        {/* Theme toggle button */}
        <ThemeToggle />
      </div>
    </header>
  );
}