import { HiOutlineCamera, HiOutlineCloudArrowUp } from 'react-icons/hi2';

export default function UploadArea() {
  return (
    <section className="upload-area">
      <div className="upload-area__halo">
        <HiOutlineCamera aria-hidden="true" />
      </div>
      <h2>Upload evidence photo</h2>
      <p>Take or select a clear photo of the issue. EXIF and GPS checks will be connected later.</p>
      <label className="upload-area__button">
        <HiOutlineCloudArrowUp aria-hidden="true" />
        Choose photo
        <input type="file" accept="image/*" />
      </label>
    </section>
  );
}

