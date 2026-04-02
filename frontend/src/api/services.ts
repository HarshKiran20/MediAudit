import client from './client';

// 1. Define the interfaces for TypeScript
export interface AnalysisRow {
  item: string;
  claimed: string;
  approved: string;
  risk_score: number;
  remarks: string;
}

export interface Policy {
  id: string;
  name: string;
  content: string;
}

export interface AuditResponse {
  id: number;
  analysis: {
    rows: AnalysisRow[];
    eligibility: {
      verdict: string;
      summary: string;
    };
  };
}

export interface HistoryRecord {
  id: number;
  filename: string;
  insurer_name: string;
  verdict: string;
  risk_score: number;
  timestamp: string;
}

// 2. Define the service functions
export const uploadBill = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/audit/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getPolicies = async (): Promise<string[]> => {
  const response = await client.get('/api/policies');
  return response.data.policies; // Returns the list of names
};

export const crossCheckBill = async (data: {
  bill_text: string;
  policy_name: string; // Changed from policy_text
  filename: string;
  insurer_name: string;
}): Promise<AuditResponse> => {
  const response = await client.post('/audit/cross-check', data);
  return response.data;
};

export const getAuditHistory = async (): Promise<HistoryRecord[]> => {
  const response = await client.get('/audit/history');
  return response.data;
};