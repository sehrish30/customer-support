import { useEffect, useState } from 'react';

const VERBS = [
  'Mustering', 'Ruminating', 'Pondering', 'Deliberating', 'Sifting',
  'Cogitating', 'Percolating', 'Contemplating', 'Rummaging', 'Synthesizing',
  'Untangling', 'Deciphering', 'Weighing', 'Mulling', 'Distilling',
];

function pickNext(current: number): number {
  let next = Math.floor(Math.random() * VERBS.length);
  if (next === current) next = (next + 1) % VERBS.length;
  return next;
}

export function ThinkingVerb(): React.JSX.Element {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * VERBS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => pickNext(prev));
        setVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`thinking-verb${visible ? ' thinking-verb--in' : ' thinking-verb--out'}`}>
      {VERBS[index]}…
    </span>
  );
}
