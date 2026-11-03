export const ProgressBar = () => (
  <div
    className="pointer-events-none fixed inset-x-0 top-0 z-60 h-1 overflow-hidden"
    role="progressbar"
    aria-label="Loading page"
  >
    <div className="h-full w-1/3 animate-page-progress bg-primary-500 motion-reduce:animate-none" />
  </div>
);
