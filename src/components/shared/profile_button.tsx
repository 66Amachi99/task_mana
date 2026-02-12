'use client';

import { useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { LogOutButton } from "../shared/logout_button";
import { AuthButton } from "../shared/auth_button";

export const ProfilePopover = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="outline" disabled>
        Загрузка...
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {session ? (
            <>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {session.user?.user_login?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span>{session.user?.user_login}</span>
            </>
          ) : (
            'Профиль'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          {!session ? (
            <AuthButton />
          ) : (
            <>
              {/* Информация о пользователе */}
              <div className="px-3 py-2 border-b">
                <p className="font-medium">{session.user?.user_login}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {session.user?.admin_role && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Админ</span>
                  )}
                  {session.user?.SMM_role && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">SMM</span>
                  )}
                  {session.user?.designer_role && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Дизайнер</span>
                  )}
                  {session.user?.videomaker_role && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Видеомейкер</span>
                  )}
                  {session.user?.coordinator_role && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Координатор</span>
                  )}
                </div>
              </div>
              <LogOutButton />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};