import { REPORT_CATEGORIES } from '../../utils/constants.js';

export function ReportForm({ onSubmit, isSubmitting = false }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label className="field">
        Title
        <input name="title" required />
      </label>
      <label className="field">
        Category
        <select name="category" required>
          <option value="">Select category</option>
          {REPORT_CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Description
        <textarea name="description" rows="5" required />
      </label>
      <button className="button" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit report'}
      </button>
    </form>
  );
}

