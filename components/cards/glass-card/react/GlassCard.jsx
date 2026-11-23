export default function GlassCard() {
  return (
    <div className="gc-scene">
      <div className="gc-box">
        <span className="gc-chips" aria-hidden="true" />
        <article className="gc-card" tabIndex={0}>
          <div className="gc-avatar" aria-hidden="true">AK</div>
          <h2 className="gc-name">Amira Khan</h2>
          <p className="gc-role">Product Designer</p>
          <ul className="gc-stats">
            <li><strong>128</strong><span>Projects</span></li>
            <li><strong>4.9k</strong><span>Followers</span></li>
            <li><strong>312</strong><span>Following</span></li>
          </ul>
        </article>
      </div>
    </div>
  );
}
