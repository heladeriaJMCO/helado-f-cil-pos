import { useDataStore } from '@/store/dataStore';

let syncInterval: ReturnType<typeof setInterval> | null = null;

export async function attemptSync(): Promise<boolean> {
  const state = useDataStore.getState();
  const { companyConfig } = state;

  if (!companyConfig.serverIP) {
    console.log('[Sync] No server IP configured');
    return false;
  }

  try {
    const payload = {
      sales: state.sales.filter(s => !s.synced),
      cashRegisters: state.cashRegisters.filter(cr => !cr.synced),
      cashMovements: state.cashMovements.filter(cm => !cm.synced),
      products: state.products,
      categories: state.categories,
      priceLists: state.priceLists,
      productPrices: state.productPrices,
    };

    const response = await fetch(`http://${companyConfig.serverIP}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      // Mark all records as synced
      useDataStore.setState(s => ({
        sales: s.sales.map(sale => ({ ...sale, synced: true })),
        cashRegisters: s.cashRegisters.map(cr => ({ ...cr, synced: true })),
        cashMovements: s.cashMovements.map(cm => ({ ...cm, synced: true })),
        companyConfig: {
          ...s.companyConfig,
          lastSyncDate: new Date().toISOString(),
        },
      }));
      console.log('[Sync] Success at', new Date().toISOString());
      return true;
    }
    console.warn('[Sync] Server responded with', response.status);
    return false;
  } catch (err) {
    console.warn('[Sync] Failed:', err);
    return false;
  }
}

export function startSyncSchedule() {
  if (syncInterval) return;
  // Try every hour
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      attemptSync();
    }
  }, 60 * 60 * 1000);
  console.log('[Sync] Scheduled hourly sync');
}

export function stopSyncSchedule() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function purgeOldLocalData() {
  const state = useDataStore.getState();
  const { lastSyncDate } = state.companyConfig;

  if (!lastSyncDate) return;

  const syncDate = new Date(lastSyncDate);
  const cutoff = new Date(syncDate.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days before last sync

  state.purgeOldData(cutoff.toISOString());
  console.log('[Purge] Removed data older than', cutoff.toISOString());
}
