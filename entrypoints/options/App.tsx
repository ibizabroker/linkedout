import type { ReactElement } from 'react';
import {
  BlockedCompaniesPage,
  useBlocklistSession,
} from '@/lib/ui/BlockedCompanies';

export default function App(): ReactElement {
  const { companies, unblock, failureText } = useBlocklistSession();
  return (
    <BlockedCompaniesPage
      companies={companies}
      failureText={failureText}
      onUnblock={unblock}
    />
  );
}
