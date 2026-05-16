import { useState, useEffect } from 'react';

export function useAlgoRate(fallbackRate = 12.75) {
  const [rate, setRate] = useState(fallbackRate);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=inr')
      .then(res => res.json())
      .then(data => {
        if (data?.algorand?.inr) {
          setRate(data.algorand.inr);
        }
      })
      .catch(err => {
        console.warn("Could not fetch ALGO rate, using fallback.", err);
      });
  }, []);

  return rate;
}
