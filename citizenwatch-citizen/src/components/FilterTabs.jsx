const filters = ['All', 'Pending', 'Verified', 'In Progress', 'Resolved'];

export default function FilterTabs() {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Report filters">
      {filters.map((filter, index) => (
        <button className={index === 0 ? 'active' : ''} key={filter} type="button">
          {filter}
        </button>
      ))}
    </div>
  );
}
