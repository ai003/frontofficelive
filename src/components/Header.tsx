// Header component with Hacker News-inspired blue header styling
// Displays the site logo and title in a clean, professional layout
export default function Header() {
  return (
    <header 
      className="w-full py-3 px-4"
      style={{ backgroundColor: 'var(--header-blue)' }}
    >
      {/* Container to constrain header content to max-width and center it */}
      <div 
        className="flex items-center gap-4"
        style={{ 
          maxWidth: 'var(--max-width)', 
          margin: '0 auto',
          color: 'var(--header-text)'
        }}
      >
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
    </header>
  );
}