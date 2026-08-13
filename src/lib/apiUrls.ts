// Единый источник адресов backend-функций.
// При изменении URL функции меняем значение ТОЛЬКО здесь.
// Синхронизировано с backend/func2url.json

export const API_URLS = {
  cleaningSchedule: 'https://functions.poehali.dev/763769d4-880c-4e9f-8350-9ef2c9551ec3',
  backupFinances: 'https://functions.poehali.dev/fdc50076-fc3b-4243-aebc-dfeb4c16e1ff',
  userPhotos: 'https://functions.poehali.dev/421d7306-953f-4005-be95-aa8f6eef152b',
  achievements: 'https://functions.poehali.dev/d7026ab9-6f18-4c66-bc74-9630a5d5feb3',
  profile: 'https://functions.poehali.dev/26db15cb-944e-44b5-a0e5-5b2c90b9a0ad',
  earnedBonuses: 'https://functions.poehali.dev/c17a79b2-6523-4a7e-91c9-bd6ab3b7edad',
  producerPlans: 'https://functions.poehali.dev/eedbe518-92b8-4825-a96c-aa08edb9a87c',
  shiftProgress: 'https://functions.poehali.dev/48f9d5f3-5462-4755-bcac-cfc68a0546af',
  modelPairs: 'https://functions.poehali.dev/cdf24c81-2f72-4f88-bddc-77533a2d119f',
  tasks: 'https://functions.poehali.dev/7de9b994-871a-4c9d-9260-edcb005ce100',
  migratePasswords: 'https://functions.poehali.dev/2bb7593a-a13f-433a-b83b-f2202e90abaa',
  blockedDates: 'https://functions.poehali.dev/b37e0422-df3c-42f3-9e5c-04d8f1eedd5c',
  directorFinances: 'https://functions.poehali.dev/32834f55-221d-44d6-b7a6-544c4ac155ec',
  cleanupOldSchedules: 'https://functions.poehali.dev/3d052c34-5e62-42e8-840c-ce2fcc665eef',
  cleanupOrphanedAssignments: 'https://functions.poehali.dev/ebdade58-dd83-497b-bd3b-570e724eed8b',
  producerStats: 'https://functions.poehali.dev/d82439a1-a9ac-4798-a02a-8874ce48e24b',
  salaryAdjustments: 'https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7',
  statistics: 'https://functions.poehali.dev/a154a7bf-592e-48d3-b0ce-6724de856af0',
  aggregatedFinances: 'https://functions.poehali.dev/003274b3-54d7-44d9-8411-b37a5048c3c9',
  calculateSalaries: 'https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e',
  modelAccounts: 'https://functions.poehali.dev/6eb743de-2cae-499d-8e8f-4aa975cb470c',
  cbrRate: 'https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a',
  saveFinances: 'https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e',
  schedule: 'https://functions.poehali.dev/c792d156-9cde-432c-9dbf-1f7374a94184',
  producerAssignments: 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6',
  operatorAssignments: 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30',
  auth: 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066',
} as const;

export type ApiUrlKey = keyof typeof API_URLS;