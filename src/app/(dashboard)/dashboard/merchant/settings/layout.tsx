import type {
  ReactNode,
} from "react";

import {
  MerchantSettingsProvider,
} from "./MerchantSettingsContext";

import SettingsShell
  from "./components/SettingsShell";

export default function MerchantSettingsLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <MerchantSettingsProvider>
      <SettingsShell>
        {children}
      </SettingsShell>
    </MerchantSettingsProvider>
  );
}