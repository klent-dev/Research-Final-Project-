export default function StepIndicator({ steps = [], currentStep = 1 }) {
  return (
    <ol className="step-indicator" aria-label="Report submission steps">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const state = stepNumber < currentStep ? 'complete' : stepNumber === currentStep ? 'active' : 'upcoming';

        return (
          <li className={`step-indicator__item step-indicator__item--${state}`} key={step}>
            <span>{stepNumber}</span>
            <small>{step}</small>
          </li>
        );
      })}
    </ol>
  );
}

