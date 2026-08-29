import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as api from '../../api';

export interface ESGMetrics {
  environmental: {
    waterSavedLitres: number;
    sanitationIssuesResolved: number;
    solarPumpsFunctional: number;
    wasteDisposalIndexPct: number;
    co2OffsetKg: number;
  };
  social: {
    citizensAssisted: number;
    grievanceSatisfactionPct: number;
    avgResolutionTimeHours: number;
    activeFieldTechnicians: number;
    schemesBeneficiariesReached: number;
  };
  governance: {
    totalComplaintsLogged: number;
    auditContinuityPct: number;
    slaCompliancePct: number;
    verifiedResolutions: number;
    cryptographicBlocksSealed: number;
  };
  lastUpdated: string;
}

export interface ESGState {
  metrics: ESGMetrics;
  auditChain: any[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ESGState = {
  metrics: {
    environmental: {
      waterSavedLitres: 142500,
      sanitationIssuesResolved: 48,
      solarPumpsFunctional: 96,
      wasteDisposalIndexPct: 88.4,
      co2OffsetKg: 3200,
    },
    social: {
      citizensAssisted: 1240,
      grievanceSatisfactionPct: 94.8,
      avgResolutionTimeHours: 18.5,
      activeFieldTechnicians: 14,
      schemesBeneficiariesReached: 820,
    },
    governance: {
      totalComplaintsLogged: 128,
      auditContinuityPct: 100.0,
      slaCompliancePct: 96.2,
      verifiedResolutions: 112,
      cryptographicBlocksSealed: 256,
    },
    lastUpdated: new Date().toISOString(),
  },
  auditChain: [],
  status: 'idle',
  error: null,
};

export const fetchESGAuditChainAsync = createAsyncThunk(
  'esg/fetchAuditChain',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.fetchAuditChain();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load governance audit ledger');
    }
  }
);

export const esgSlice = createSlice({
  name: 'esg',
  initialState,
  reducers: {
    setESGMetrics: (state, action: PayloadAction<ESGMetrics>) => {
      state.metrics = action.payload;
    },
    updateGovernanceAuditCount: (state, action: PayloadAction<number>) => {
      state.metrics.governance.cryptographicBlocksSealed = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchESGAuditChainAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchESGAuditChainAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.auditChain = action.payload;
        if (action.payload && action.payload.length > 0) {
          state.metrics.governance.cryptographicBlocksSealed = action.payload.length;
        }
      })
      .addCase(fetchESGAuditChainAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load audit chain';
      });
  },
});

export const { setESGMetrics, updateGovernanceAuditCount } = esgSlice.actions;
export default esgSlice.reducer;
