import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationPicker } from '../../components/map/LocationPicker.jsx';
import { ReportForm } from '../../components/reports/ReportForm.jsx';
import { ReportPhotoInput } from '../../components/reports/ReportPhotoInput.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { attachReportPhoto, createInfrastructureReport } from '../../services/reportService.js';
import { validateExifGpsProximity } from '../../services/exifValidationService.js';
import { uploadReportPhoto } from '../../services/storageService.js';
import { DEFAULT_GPS_RADIUS_METERS } from '../../utils/constants.js';

export default function CreateReportPage() {
  const { user } = useAuth();
  const { location, error, isLocating, requestLocation } = useGeolocation();
  const [photo, setPhoto] = useState(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function handlePhotoChange(event) {
    const [file] = event.target.files;
    setPhoto(file);
    setPhotoMessage(file ? 'Photo selected. EXIF GPS will be validated on submit.' : '');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!location || !photo) return;

    setIsSubmitting(true);
    const exifResult = await validateExifGpsProximity({
      file: photo,
      browserLocation: location,
      radiusMeters: DEFAULT_GPS_RADIUS_METERS
    });

    if (!exifResult.isValid) {
      setPhotoMessage(exifResult.reason);
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reportId = await createInfrastructureReport({
      title: formData.get('title'),
      category: formData.get('category'),
      description: formData.get('description'),
      createdBy: user.uid,
      location,
      exif: exifResult
    });

    const photoUrl = await uploadReportPhoto({ file: photo, reportId, userId: user.uid });
    await attachReportPhoto({ reportId, photoUrl });

    navigate(`/reports/${reportId}`);
  }

  return (
    <main className="page">
      <h1>New Infrastructure Report</h1>
      {error && <p>{error}</p>}
      <LocationPicker location={location} onUseCurrentLocation={requestLocation} isLocating={isLocating} />
      <ReportPhotoInput onChange={handlePhotoChange} validationMessage={photoMessage} />
      <ReportForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
