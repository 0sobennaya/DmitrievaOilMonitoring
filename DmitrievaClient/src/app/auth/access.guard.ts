import { inject } from "@angular/core"
import { AuthService } from "../data/services/auth.service"
import { Router } from "@angular/router"

export const canActivateAuth = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuth) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
export const notLaborantGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasRole('Laborant')) {
    return router.createUrlTree(['/pumps']);
  }
  return true;
};
export const notEngineerGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasRole('Engineer')) {
    return router.createUrlTree(['/oils']);
  }
  return true;
};