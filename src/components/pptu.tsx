import Link from 'next/link';

export default function PPTU() {
  return (
    <div className="flex justify-center mt-9  space-x-4 text-[16px] font-[400]  text-white">
      <Link href="/privacy" className="hover:text-zinc-400">
        Privacy Policy
      </Link>
      <Link href="/terms" className="hover:text-zinc-400">
        Terms of Use
      </Link>
    </div>
  );
}

