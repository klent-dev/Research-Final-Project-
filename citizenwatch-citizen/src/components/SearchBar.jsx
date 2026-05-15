import { HiMagnifyingGlass } from 'react-icons/hi2';

export default function SearchBar({ placeholder = 'Search' }) {
  return (
    <label className="search-bar">
      <HiMagnifyingGlass aria-hidden="true" />
      <input type="search" placeholder={placeholder} />
    </label>
  );
}

