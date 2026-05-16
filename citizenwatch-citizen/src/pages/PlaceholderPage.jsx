import PageContainer from '../components/PageContainer.jsx';

export default function PlaceholderPage({ title, description }) {
  return (
    <PageContainer className="placeholder-page">
      <section>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
    </PageContainer>
  );
}

