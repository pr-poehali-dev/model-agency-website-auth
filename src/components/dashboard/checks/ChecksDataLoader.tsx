import { authenticatedFetch } from '@/lib/api';

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const SALARIES_API_URL = 'https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e';
const ADJUSTMENTS_API_URL = 'https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7';
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';

export const loadExchangeRate = async (
  setCbrRate: (rate: number) => void,
  setExchangeRate: (rate: number) => void,
  setIsLoadingRate: (loading: boolean) => void
) => {
  setIsLoadingRate(true);
  try {
    const response = await authenticatedFetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a');
    const data = await response.json();
    if (data.rate) {
      const cbrRate = data.rate;
      const workingRate = cbrRate - 5;
      setCbrRate(cbrRate);
      setExchangeRate(workingRate);
    }
  } catch (err) {
    console.error('Failed to load exchange rate from CBR', err);
  } finally {
    setIsLoadingRate(false);
  }
};

export const loadUserRole = async (
  email: string,
  setUserRole: (role: string) => void,
  setIsLoadingRole: (loading: boolean) => void
) => {
  try {
    const response = await authenticatedFetch(USERS_API_URL);
    if (!response.ok) {
      setIsLoadingRole(false);
      return;
    }
    const users = await response.json();
    const user = users.find((u: any) => u.email === email);
    if (user) {
      setUserRole(user.role);
    }
  } catch (err) {
    console.error('Failed to load user role', err);
  } finally {
    setIsLoadingRole(false);
  }
};

export const loadUsers = async (setUsers: (users: any[]) => void) => {
  try {
    const response = await authenticatedFetch(USERS_API_URL);
    if (!response.ok) return;
    const data = await response.json();
    setUsers(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Failed to load users', err);
    setUsers([]);
  }
};

export const loadAllAssignments = async (setAllAssignments: (assignments: any[]) => void) => {
  try {
    const response = await authenticatedFetch(ASSIGNMENTS_API_URL);
    if (!response.ok) return;
    const assignments = await response.json();
    setAllAssignments(Array.isArray(assignments) ? assignments : []);
  } catch (err) {
    console.error('Failed to load all assignments', err);
    setAllAssignments([]);
  }
};

export const loadProducerAssignments = async (
  email: string,
  setProducerModels: (models: any[]) => void,
  setProducerOperators: (operators: any[]) => void,
  setProducerAssignments: (assignments: any[]) => void
) => {
  try {
    const response = await authenticatedFetch(ASSIGNMENTS_API_URL);
    if (!response.ok) return;
    const assignments = await response.json();
    
    const [producerModelResponse, producerOperatorResponse] = await Promise.all([
      authenticatedFetch(`${PRODUCER_API_URL}?producer=${encodeURIComponent(email)}&type=model`),
      authenticatedFetch(`${PRODUCER_API_URL}?producer=${encodeURIComponent(email)}&type=operator`)
    ]);
    
    const producerModelsData = await producerModelResponse.json();
    const producerOperatorsData = await producerOperatorResponse.json();
    
    const producerModelEmails = producerModelsData.map((pm: any) => pm.modelEmail);
    
    const filteredAssignments = assignments.filter((a: any) => 
      producerModelEmails.includes(a.modelEmail)
    );
    
    setProducerModels(producerModelsData);
    setProducerOperators(producerOperatorsData);
    setProducerAssignments(filteredAssignments);
  } catch (err) {
    console.error('Failed to load producer assignments', err);
  }
};

export const loadSalaries = async (
  currentPeriod: any,
  setSalaries: (salaries: any) => void
) => {
  try {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const periodStart = formatDate(currentPeriod.startDate);
    const periodEnd = formatDate(currentPeriod.endDate);
    
    const response = await authenticatedFetch(`${SALARIES_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`);
    if (response.ok) {
      const data = await response.json();
      setSalaries(data);
    }
  } catch (err) {
    console.error('Failed to load salaries', err);
  }
};

export const loadAdjustments = async (
  currentPeriod: any,
  setAdjustments: (adjustments: any) => void
) => {
  try {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const periodStart = formatDate(currentPeriod.startDate);
    const periodEnd = formatDate(currentPeriod.endDate);
    
    const response = await authenticatedFetch(`${ADJUSTMENTS_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`);
    if (response.ok) {
      const data = await response.json();
      setAdjustments(data);
    }
  } catch (err) {
    console.error('Failed to load adjustments', err);
  }
};

export const handleUpdateProducer = async (
  email: string,
  field: 'expenses' | 'advance' | 'penalty',
  value: number,
  currentPeriod: any,
  userEmail: string,
  reloadAdjustments: () => void
) => {
  try {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const periodStart = formatDate(currentPeriod.startDate);
    const periodEnd = formatDate(currentPeriod.endDate);
    
    await authenticatedFetch(ADJUSTMENTS_API_URL, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Email': userEmail
      },
      body: JSON.stringify({
        email,
        role: 'producer',
        period_start: periodStart,
        period_end: periodEnd,
        field,
        value
      })
    });
    
    await reloadAdjustments();
  } catch (err) {
    console.error('Failed to update producer adjustment', err);
  }
};

export const handleUpdateEmployee = async (
  email: string,
  field: 'advance' | 'penalty',
  value: number,
  currentPeriod: any,
  userEmail: string,
  users: any[],
  reloadAdjustments: () => void
) => {
  try {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const periodStart = formatDate(currentPeriod.startDate);
    const periodEnd = formatDate(currentPeriod.endDate);
    
    const user = users.find(u => u.email === email);
    const role = user?.role === 'content_maker' ? 'model' : 'operator';
    
    await authenticatedFetch(ADJUSTMENTS_API_URL, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Email': userEmail
      },
      body: JSON.stringify({
        email,
        role,
        period_start: periodStart,
        period_end: periodEnd,
        field,
        value
      })
    });
    
    await reloadAdjustments();
  } catch (err) {
    console.error('Failed to update employee adjustment', err);
  }
};
