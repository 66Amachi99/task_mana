import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    user_login: string;
    admin_role: boolean;
    SMM_role: boolean;
    designer_role: boolean;
    videomaker_role: boolean;
    coordinator_role: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      user_login: string;
      admin_role: boolean;
      SMM_role: boolean;
      designer_role: boolean;
      videomaker_role: boolean;
      coordinator_role: boolean;
    }
  }
}