export function ReportPhotoInput({ onChange, validationMessage }) {
  return (
    <label className="field">
      Evidence Photo
      <input type="file" accept="image/*" capture="environment" onChange={onChange} required />
      {validationMessage && <small>{validationMessage}</small>}
    </label>
  );
}

