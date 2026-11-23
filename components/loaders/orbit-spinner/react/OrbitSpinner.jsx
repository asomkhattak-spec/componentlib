export default function OrbitSpinner() {
  return (
    <div className="os-spinner" role="status" aria-label="Loading">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="os-arm" />
      ))}
    </div>
  );
}
