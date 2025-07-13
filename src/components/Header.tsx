import ThemeToggle from './ThemeToggle';

// Header component with Hacker News-inspired blue header styling
// Displays the site logo and title in a clean, professional layout
export default function Header() {
  // DARK THEME: Header background color changes
  // bg-blue-500 (standard blue) -> dark:bg-blue-700 (darker blue when dark mode active)
  return (
    <header className="w-full py-3 px-4 bg-blue-500 dark:bg-blue-700">
      {/* Container to constrain header content to max-width and center it */}
      <div className="flex items-center justify-between max-w-4xl mx-auto text-white">
        <div className="flex items-center gap-1">
          {/* Logo container with fixed dimensions 
          have to edit to make betterr
          */}
          <div className=" overflow-hidden rounded">
            <img 
              src="/frontOffice-live-logo.png" 
              alt="FrontOffice.live Logo" 
              className="h-full w-full object-cover"
              style={{ maxHeight: '50px', maxWidth: '50px' }}
            />
          </div>
        
          {/* Site title with clean typography */}
          <h1 className="text-xl font-semibold text-white">
            Front Office
          </h1>
        </div>
        
        {/* Theme toggle button */}
        <ThemeToggle />
      </div>
    </header>
  );
}