import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    user_login: string;
    admin_role: boolean;
    SMM_role: boolean;
    designer_role: boolean;
    coordinator_role: boolean;
    photographer_role: boolean;
  }

  interface Session {
    user: {
      id: string;
      user_login: string;
      admin_role: boolean;
      SMM_role: boolean;
      designer_role: boolean;
      coordinator_role: boolean;
      photographer_role: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    user_login: string;
    admin_role: boolean;
    SMM_role: boolean;
    designer_role: boolean;
    coordinator_role: boolean;
    photographer_role: boolean;
  }
}