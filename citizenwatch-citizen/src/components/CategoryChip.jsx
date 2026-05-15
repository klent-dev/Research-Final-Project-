export default function CategoryChip({ label, active = false }) {
  return (
    <button className={active ? 'category-chip active' : 'category-chip'} type="button">
      {label}
    </button>
  );
}

