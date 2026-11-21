/** Renders the plain-text body: blank lines split paragraphs, "- " lines become a list. */
export function ProjectBody({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="pf-prose">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim());
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{lines.join(' ')}</p>;
      })}
    </div>
  );
}
