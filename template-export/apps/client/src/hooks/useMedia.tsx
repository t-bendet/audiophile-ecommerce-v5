import { useState, useEffect } from "react";

const breakPointsMap = {
  sm: "(min-width: 36rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
} as const;

type BreakPoint = keyof typeof breakPointsMap;

const useMedia = (queryKey: BreakPoint) => {
  const query = breakPointsMap[queryKey];
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    listener();
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

export default useMedia;
