import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./pages/companies/companies.component').then(
            (m) => m.CompaniesComponent,
          ),
      },
      {
        path: 'blockchain',
        loadComponent: () =>
          import('./pages/blockchain/blockchain.component').then(
            (m) => m.BlockchainComponent,
          ),
      },
      {
        path: 'facial-recognition',
        loadComponent: () =>
          import('./pages/facial-recognition/facial-recognition.component').then(
            (m) => m.FacialRecognitionComponent,
          ),
      },
      {
        path: 'voting/candidates',
        loadComponent: () =>
          import('./pages/voting/candidates/candidates.component').then(
            (m) => m.CandidatesComponent,
          ),
      },
      {
        path: 'voting/register',
        loadComponent: () =>
          import('./pages/voting/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'voting/manage-voters',
        loadComponent: () =>
          import('./pages/voting/manage-voters/manage-voters.component').then(
            (m) => m.ManageVotersComponent,
          ),
      },
      {
        path: 'voting/manage-elections',
        loadComponent: () =>
          import('./pages/voting/manage-elections/manage-elections.component').then(
            (m) => m.ManageElectionsComponent,
          ),
      },
      {
        path: 'voting/cast-vote',
        loadComponent: () =>
          import('./pages/voting/cast-vote/cast-vote.component').then(
            (m) => m.CastVoteComponent,
          ),
      },
      {
        path: 'voting/results',
        loadComponent: () =>
          import('./pages/voting/results/results.component').then(
            (m) => m.ResultsComponent,
          ),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
