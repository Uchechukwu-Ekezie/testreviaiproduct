import { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
}

const Typewriter = ({ text, speed = 100 }: TypewriterProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [index, text, speed]);

  return <>{displayedText}</>;
};

export default Typewriter;
