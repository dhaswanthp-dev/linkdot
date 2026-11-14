const platforms = ["Instagram", "TikTok", "YouTube", "Facebook"] as const;

export function Connections() {
  return (
    <section
      className="dashboard-section"
      aria-labelledby="connections-heading"
    >
      <div className="dashboard-section-heading">
        <div>
          <h2 id="connections-heading">Connections</h2>
          <p>Connect your social platforms when integrations are approved.</p>
        </div>
      </div>

      <div className="connection-grid">
        {platforms.map((platform) => (
          <article className="connection-card" key={platform}>
            <h3>{platform}</h3>
            <button className="btn btn-outline" type="button" disabled>
              Connect
            </button>
            <p>Available after platform approval.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
