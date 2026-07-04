export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="mx-4 mt-4 p-4 bg-danger/10 border border-danger/30 rounded-card flex items-start gap-3">
      <span className="text-danger text-xl mt-0.5">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-danger font-semibold text-sm">Connection error</p>
        <p className="text-text-muted text-xs mt-0.5 break-words">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-accent text-sm font-semibold shrink-0 active:opacity-70"
        >
          Retry
        </button>
      )}
    </div>
  );
}
