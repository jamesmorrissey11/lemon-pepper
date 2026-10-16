import { SearchExperience } from '@/components/search-experience';

export default function Home() {
  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Atlanta cocktail finder</p>
        <h1>Find a lemon pepper drop martini</h1>
        <p className="intro">
          Explore ranked web results for Atlanta venues, then follow each source to confirm
          current menu availability.
        </p>
        <p className="availability-note">
          Results are search evidence, not a guarantee that a drink is currently on the menu.
        </p>
      </header>
      <SearchExperience />
    </main>
  );
}
