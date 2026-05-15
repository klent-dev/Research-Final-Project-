import {
  HiBolt,
  HiCamera,
  HiCheckBadge,
  HiDocumentText,
  HiMapPin,
  HiShieldCheck,
  HiTag
} from 'react-icons/hi2';
import CategoryChip from '../components/CategoryChip.jsx';
import FormInput from '../components/FormInput.jsx';
import PageContainer from '../components/PageContainer.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import UploadArea from '../components/UploadArea.jsx';
import VerificationCard from '../components/VerificationCard.jsx';

const categories = ['Road Damage', 'Drainage', 'Streetlight', 'Bridge', 'Flooding', 'Other'];
const severities = ['Low', 'Medium', 'High', 'Critical'];

export default function SubmitReport() {
  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">New infrastructure report</p>
        <h1>Submit Report</h1>
        <p>Complete the guided process with evidence, location verification placeholders, issue details, and final review.</p>
      </section>

      <StepIndicator
        currentStep={1}
        steps={['Capture Evidence', 'Verify Location', 'Add Details', 'Submit Report']}
      />

      <form className="report-form">
        <section className="form-step">
          <div className="form-step__header">
            <span>Step 1</span>
            <h2>Evidence</h2>
            <p>Capture a clear photo of the infrastructure concern before submitting details.</p>
          </div>
          <UploadArea />
        </section>

        <section className="form-step">
          <div className="form-step__header">
            <span>Step 2</span>
            <h2>Location</h2>
            <p>GPS and photo metadata verification will be connected during backend integration.</p>
          </div>
          <section className="verification-grid">
            <VerificationCard
              icon={HiMapPin}
              title="Live GPS verification"
              description="Coordinate capture placeholder for browser geolocation."
              status="Awaiting location permission"
            />
            <VerificationCard
              icon={HiCheckBadge}
              title="EXIF metadata verification"
              description="Photo timestamp and location metadata placeholder."
              status="Ready after upload"
              tone="pending"
            />
          </section>
        </section>

        <section className="form-step">
          <div className="form-step__header">
            <span>Step 3</span>
            <h2>Add Details</h2>
            <p>Classify the issue so the LGU can route it to the proper response team.</p>
          </div>

          <FormInput icon={HiDocumentText} label="Issue title" type="text" placeholder="Example: Broken streetlight" />

          <div className="chip-section">
            <div className="chip-section__label">
              <HiTag />
              <span>Issue category</span>
            </div>
            <div className="category-chip-grid">
              {categories.map((category, index) => (
                <CategoryChip active={index === 0} key={category} label={category} />
              ))}
            </div>
          </div>

          <div className="chip-section">
            <div className="chip-section__label">
              <HiBolt />
              <span>Issue severity</span>
            </div>
            <div className="severity-selector">
              {severities.map((severity) => (
                <button type="button" key={severity}>
                  <SeverityBadge severity={severity} />
                </button>
              ))}
            </div>
          </div>

          <FormInput icon={HiCamera} label="Description">
            <textarea rows="5" placeholder="Describe the issue, nearby landmarks, and urgency." />
          </FormInput>

          <div className="validation-message">
            <HiShieldCheck />
            <span>Validation placeholder: required fields, image, GPS, and metadata checks will appear here.</span>
          </div>
        </section>

        <section className="form-step submit-command glass-card">
          <div>
            <HiBolt />
            <span>Step 4: Review your report before sending it to the LGU queue.</span>
          </div>
          <PrimaryButton type="button" icon={HiShieldCheck}>Review and Submit</PrimaryButton>
        </section>
      </form>

      <section className="sticky-submit-bar">
        <span>Draft ready</span>
        <PrimaryButton type="button" icon={HiShieldCheck}>Submit</PrimaryButton>
      </section>
    </PageContainer>
  );
}
