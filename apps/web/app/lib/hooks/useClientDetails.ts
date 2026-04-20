import { useState, useEffect, useCallback } from 'react';
import { getClient, listDocuments, listExpedientes, listHonorarios, listVencimientos } from '../webApi';

export interface ClientDetailsState {
  client: any | null;
  documents: any[];
  expedientes: any[];
  honorarios: any[];
  vencimientos: any[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useClientDetails(clientId: string): ClientDetailsState {
  const [state, setState] = useState<ClientDetailsState>({
    client: null,
    documents: [],
    expedientes: [],
    honorarios: [],
    vencimientos: [],
    loading: true,
    error: null,
    reload: () => {},
  });

  const load = useCallback(async () => {
    if (!clientId) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [client, docsRes, expsRes, honsRes, vencsRes] = await Promise.all([
        getClient(clientId),
        listDocuments({ clientId }).catch(() => ({ documents: [], total: 0, page: 1, pageSize: 20, raw: null, status: 0 })),
        listExpedientes({ clientId }).catch(() => ({ expedientes: [], total: 0, page: 1, pageSize: 20 })),
        listHonorarios({ clientId }).catch(() => ({ honorarios: [], total: 0, page: 1, pageSize: 20 })),
        listVencimientos({ clientId }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 50 })),
      ]);
      setState(prev => ({
        ...prev,
        client,
        documents: docsRes?.documents ?? [],
        expedientes: expsRes?.expedientes ?? [],
        honorarios: honsRes?.honorarios ?? [],
        vencimientos: vencsRes?.items ?? [],
        loading: false,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  // Inject reload into state
  useEffect(() => {
    setState(prev => ({ ...prev, reload: load }));
  }, [load]);

  return state;
}
