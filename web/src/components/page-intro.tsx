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
    <header className="grid gap-4 rounded-3xl bg-field p-6 md:p-8">
      <p className="font-mono text-xs tracking-[0.18em] uppercase text-signal">{kicker}</p>
      <h1 className="max-w-3xl text-3xl leading-tight text-balance md:text-5xl">{title}</h1>
      <p className="max-w-2xl text-base leading-7 md:text-lg">{body}</p>
    </header>
  );
}
