export function PageIntro({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <header className="grid gap-4 border-b border-rule pb-8">
      <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">{kicker}</p>
      <h1 className="max-w-3xl font-display text-4xl leading-[0.98] text-balance md:text-6xl">
        {title}
      </h1>
      <p className="max-w-2xl text-lg leading-8">{body}</p>
    </header>
  );
}
