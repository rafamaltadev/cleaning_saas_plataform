import { useState, useEffect } from 'react';
import { getFeatureFlags } from '../api/featureFlags';
import type { FeatureFlags } from '../types';

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>({});

  useEffect(() => {
    getFeatureFlags()
      .then(setFlags)
      .catch(() => setFlags({}));
  }, []);

  return flags;
}
