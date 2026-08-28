export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

export type AuthState =
  | { status: "guest"; message: string | null }
  | { status: "restoring"; message: string | null }
  | { status: "authenticated"; session: AuthSession; message: string | null }
  | { status: "error"; message: string };

export type RestoreResult =
  | { kind: "cloud"; hasCloudState: true }
  | { kind: "local"; hasCloudState: false }
  | { kind: "local-after-cloud-failure"; hasCloudState: false }
  | { kind: "local-after-interruption"; hasCloudState: false };
