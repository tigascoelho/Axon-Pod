export default function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex items-center justify-center">
      <svg
        className={`${sz} spinner`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12" cy="12" r="10"
          stroke="#2a2a2a"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="#00E676"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
