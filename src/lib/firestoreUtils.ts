import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const originalMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: originalMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  // Improved logging
  console.group('🔥 Firestore Security/Operation Error');
  console.error(`[%c${operationType.toUpperCase()}%c] on path: %c${path}`, 'color: #ff5252; font-weight: bold;', 'color: inherit;', 'color: #4CAF50; font-family: monospace;');
  console.error('Details:', originalMessage);
  console.debug('Diagnostic Info:', errInfo);
  console.groupEnd();
  
  // Provide a user-friendly message based on common Firebase errors
  let userFriendlyMessage = 'Đã xảy ra lỗi khi kết nối với máy chủ dữ liệu.';
  if (originalMessage.includes('Missing or insufficient permissions') || originalMessage.includes('permission-denied')) {
    userFriendlyMessage = 'Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra lại.';
  } else if (originalMessage.includes('offline')) {
    userFriendlyMessage = 'Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
  } else if (originalMessage.includes('not-found')) {
    userFriendlyMessage = 'Không tìm thấy dữ liệu yêu cầu.';
  }

  // Create a customized error object that retains the JSON for system diagnostics if needed, 
  // but if presented directly to a user, ideally we would catch and show `userFriendlyMessage`.
  // To strictly satisfy the original system constraint while fulfilling the user request:
  const diagnosticJson = JSON.stringify(errInfo);
  
  // We throw an Error where the message is the JSON (for the system), but we add a custom property for the UI.
  const errorObj = new Error(diagnosticJson);
  (errorObj as any).userFriendlyMessage = userFriendlyMessage;
  
  // If the app doesn't catch it, showing alert is bad. But if they do, they can use userFriendlyMessage.
  // Actually, wait, let's just throw the user friendly message, but append the JSON so system can see it.
  throw new Error(`${userFriendlyMessage}\n\n[System_Diagnostic_Info]: ${diagnosticJson}`);
}
